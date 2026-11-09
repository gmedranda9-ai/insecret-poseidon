/* Capa de datos de InSecret.
 * Producción: llama a funciones RPC de Supabase (el sorteo se hace en el servidor).
 * Demo (?demo=1): simula todo en el navegador SOLO para ver el diseño. Nunca para uso real. */
(function () {
  'use strict';
  var cfg = window.INSECRET_CONFIG || {};
  var qs = new URLSearchParams(location.search);
  var DEMO = qs.get('demo') === '1';
  var CONFIGURED = !!(cfg.supabaseUrl && cfg.supabaseKey);

  function token() {
    var a = new Uint8Array(24); crypto.getRandomValues(a);
    return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /* ---------- Solucionador (también se usa para avisar si las exclusiones lo hacen imposible) ---------- */
  // n personas, forb = Set de "i-j" (i no puede regalar a j). Devuelve array receptor[i] o null.
  function solve(n, forb, maxNodes) {
    var order = [], i;
    for (i = 0; i < n; i++) order.push(i);
    shuffle(order);
    var recv = new Array(n).fill(-1), used = new Array(n).fill(false), nodes = 0, aborted = false;
    function rec(k) {
      if (k === n) return true;
      if (++nodes > (maxNodes || 200000)) { aborted = true; return false; }
      var g = order[k], cands = [], j;
      for (j = 0; j < n; j++) if (j !== g && !used[j] && !forb.has(g + '-' + j)) cands.push(j);
      shuffle(cands);
      for (var c = 0; c < cands.length; c++) {
        recv[g] = cands[c]; used[cands[c]] = true;
        if (rec(k + 1)) return true;
        used[cands[c]] = false; recv[g] = -1;
        if (aborted) return false;
      }
      return false;
    }
    var ok = rec(0);
    return { ok: ok, aborted: aborted, recv: recv };
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var r = new Uint32Array(1); crypto.getRandomValues(r);
      var j = r[0] % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function forbSet(pairs) {
    var s = new Set();
    (pairs || []).forEach(function (p) { s.add(p[0] + '-' + p[1]); s.add(p[1] + '-' + p[0]); });
    return s;
  }
  // Comprobación rápida (solo para avisar en pantalla; el sorteo real es del servidor)
  function feasible(n, pairs) {
    var r = solve(n, forbSet(pairs), 60000);
    return r.aborted ? true : r.ok;
  }

  /* ---------- Producción: Supabase RPC ---------- */
  var CODES = ['NO_SOLUTION', 'NOT_FOUND', 'BAD_PIN', 'LOCKED', 'BAD_INPUT'];
  function rpc(fn, body) {
    return fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseKey, Authorization: 'Bearer ' + cfg.supabaseKey },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = (data && (data.message || data.hint || data.details)) || '';
          var e = new Error(msg || 'Error de servidor');
          e.code = 'SERVER';
          CODES.forEach(function (c) { if (msg.indexOf(c) >= 0) e.code = c; });
          throw e;
        }
        return data;
      });
    }, function () { var e = new Error('Sin conexión'); e.code = 'NETWORK'; throw e; });
  }

  var remote = {
    createDraw: function (p) {
      return rpc('create_draw', {
        p_group: p.group_name, p_organizer: p.organizer, p_event_date: p.event_date,
        p_budget: p.budget, p_message: p.message,
        p_participants: p.participants, p_exclusions: p.exclusions,
        p_contact: p.contact || null, p_marketing: !!p.marketing
      });
    },
    organizerStatus: function (t) { return rpc('organizer_status', { p_token: t }); },
    resetParticipant: function (t, ref) { return rpc('reset_participant', { p_org_token: t, p_ref: ref }); },
    groupInfo: function (g) { return rpc('group_info', { p_group_token: g }); },
    groupEnter: function (g, ref, pin) { return rpc('group_enter', { p_group_token: g, p_ref: ref, p_pin: pin }); },
    reveal: function (t) { return rpc('reveal_assignment', { p_token: t }); },
    saveWish: function (t, w) { return rpc('save_wish', { p_token: t, p_wish: w }); }
  };

  /* ---------- Demo local (solo vista previa) ---------- */
  var DB = 'insecret_demo_db';
  function load() { try { return JSON.parse(localStorage.getItem(DB)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(DB, JSON.stringify(d)); } catch (e) {} }
  function fail(code) { var e = new Error(code); e.code = code; return e; }
  function findGroup(pred) { var d = load(), k; for (k in d) if (pred(d[k], k)) return { d: d, k: k, g: d[k] }; return null; }
  function findPerson(t) {
    var d = load(), k, i;
    for (k in d) for (i = 0; i < d[k].people.length; i++) if (d[k].people[i].token === t) return { d: d, g: d[k], me: d[k].people[i], i: i };
    return null;
  }
  var demo = {
    createDraw: function (p) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var n = p.participants.length, r = solve(n, forbSet(p.exclusions), 400000);
          if (!r.ok) return reject(fail('NO_SOLUTION'));
          var d = load(), org = token(), grp = token();
          var people = p.participants.map(function (x, i) { return { name: x.name, wish: '', token: token(), opened: false, to: r.recv[i], pin: null, tries: 0 }; });
          d[org] = { group_token: grp, group_name: p.group_name, organizer: p.organizer, event_date: p.event_date, budget: p.budget, message: p.message, people: people };
          save(d);
          resolve({ organizer_token: org, group_token: grp });
        }, 700);
      });
    },
    organizerStatus: function (t) {
      return new Promise(function (resolve, reject) {
        var g = load()[t]; if (!g) return reject(fail('NOT_FOUND'));
        resolve({ group_token: g.group_token, group_name: g.group_name, organizer: g.organizer, event_date: g.event_date, budget: g.budget,
          participants: g.people.map(function (x, i) { return { ref: i, name: x.name, token: x.token, opened: x.opened, claimed: !!x.pin }; }) });
      });
    },
    resetParticipant: function (t, ref) {
      return new Promise(function (resolve, reject) {
        var d = load(), g = d[t]; if (!g || !g.people[ref]) return reject(fail('NOT_FOUND'));
        var x = g.people[ref]; x.token = token(); x.pin = null; x.tries = 0; x.opened = false; save(d); resolve({ ok: true });
      });
    },
    groupInfo: function (gt) {
      return new Promise(function (resolve, reject) {
        var f = findGroup(function (g) { return g.group_token === gt; }); if (!f) return reject(fail('NOT_FOUND'));
        resolve({ group_name: f.g.group_name, organizer: f.g.organizer, event_date: f.g.event_date,
          participants: f.g.people.map(function (x, i) { return { ref: i, name: x.name, claimed: !!x.pin }; }) });
      });
    },
    groupEnter: function (gt, ref, pin) {
      return new Promise(function (resolve, reject) {
        var f = findGroup(function (g) { return g.group_token === gt; }); if (!f || !f.g.people[ref]) return reject(fail('NOT_FOUND'));
        var x = f.g.people[ref];
        if (!/^\d{4}$/.test(pin)) return reject(fail('BAD_INPUT'));
        if (x.tries >= 5) return reject(fail('LOCKED'));
        if (!x.pin) x.pin = pin;
        else if (x.pin !== pin) { x.tries++; save(f.d); return reject(fail(x.tries >= 5 ? 'LOCKED' : 'BAD_PIN')); }
        x.tries = 0; save(f.d); resolve({ token: x.token });
      });
    },
    reveal: function (t) {
      return new Promise(function (resolve, reject) {
        var f = findPerson(t); if (!f) return reject(fail('NOT_FOUND'));
        var to = f.g.people[f.me.to]; f.me.opened = true; save(f.d);
        resolve({ giver: f.me.name, receiver: to.name, wish: to.wish, my_wish: f.me.wish, group_name: f.g.group_name, organizer: f.g.organizer,
          event_date: f.g.event_date, budget: f.g.budget, message: f.g.message });
      });
    },
    saveWish: function (t, w) {
      return new Promise(function (resolve, reject) {
        var f = findPerson(t); if (!f) return reject(fail('NOT_FOUND'));
        f.me.wish = String(w || '').slice(0, 300); save(f.d); resolve({ ok: true });
      });
    }
  };

  var api = { mode: DEMO ? 'demo' : (CONFIGURED ? 'live' : 'off'), ready: DEMO || CONFIGURED, feasible: feasible };
  ['createDraw', 'organizerStatus', 'resetParticipant', 'groupInfo', 'groupEnter', 'reveal', 'saveWish'].forEach(function (k) {
    api[k] = function () { var t = DEMO ? demo : remote; return t[k].apply(t, arguments); };
  });
  window.InSecretAPI = api;
})();
