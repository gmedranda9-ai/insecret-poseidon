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
          e.code = /NO_SOLUTION/.test(msg) ? 'NO_SOLUTION' : /NOT_FOUND/.test(msg) ? 'NOT_FOUND' : 'SERVER';
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
    reveal: function (t) { return rpc('reveal_assignment', { p_token: t }); }
  };

  /* ---------- Demo local ---------- */
  var DB = 'insecret_demo_db';
  function load() { try { return JSON.parse(localStorage.getItem(DB)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(DB, JSON.stringify(d)); } catch (e) {} }
  var demo = {
    createDraw: function (p) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var n = p.participants.length;
          var r = solve(n, forbSet(p.exclusions), 400000);
          if (!r.ok) { var e = new Error('NO_SOLUTION'); e.code = 'NO_SOLUTION'; return reject(e); }
          var d = load(), org = token();
          var people = p.participants.map(function (x, i) { return { name: x.name, wish: x.wish || '', token: token(), opened: false, to: r.recv[i] }; });
          d[org] = { group_name: p.group_name, organizer: p.organizer, event_date: p.event_date, budget: p.budget, message: p.message, people: people };
          save(d);
          resolve({ organizer_token: org, participants: people.map(function (x) { return { name: x.name, token: x.token }; }) });
        }, 700);
      });
    },
    organizerStatus: function (t) {
      return new Promise(function (resolve, reject) {
        var g = load()[t];
        if (!g) { var e = new Error('NOT_FOUND'); e.code = 'NOT_FOUND'; return reject(e); }
        resolve({ group_name: g.group_name, organizer: g.organizer, event_date: g.event_date, budget: g.budget,
          participants: g.people.map(function (x) { return { name: x.name, token: x.token, opened: x.opened }; }) });
      });
    },
    reveal: function (t) {
      return new Promise(function (resolve, reject) {
        var d = load(), k, i;
        for (k in d) for (i = 0; i < d[k].people.length; i++) if (d[k].people[i].token === t) {
          var g = d[k], me = g.people[i], to = g.people[me.to];
          me.opened = true; save(d);
          return resolve({ giver: me.name, receiver: to.name, wish: to.wish, group_name: g.group_name, organizer: g.organizer,
            event_date: g.event_date, budget: g.budget, message: g.message });
        }
        var e = new Error('NOT_FOUND'); e.code = 'NOT_FOUND'; reject(e);
      });
    }
  };

  window.InSecretAPI = {
    mode: DEMO ? 'demo' : (CONFIGURED ? 'live' : 'off'),
    ready: DEMO || CONFIGURED,
    feasible: feasible,
    createDraw: function (p) { return (DEMO ? demo : remote).createDraw(p); },
    organizerStatus: function (t) { return (DEMO ? demo : remote).organizerStatus(t); },
    reveal: function (t) { return (DEMO ? demo : remote).reveal(t); }
  };
})();
