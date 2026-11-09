/* InSecret Poseidón · lógica de la interfaz */
(function () {
  'use strict';
  var API = window.InSecretAPI, FX = window.InSecretFX;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).trim().replace(/\s+/g, ' '); }
  function key(s) { return norm(s).toLowerCase(); }

  var qs = new URLSearchParams(location.search);
  var BASE = location.href.split('?')[0].split('#')[0];
  var ORG_KEY = 'insecret_org';
  var MAX_PEOPLE = 50, MIN_PEOPLE = 3;

  var S = { step: 1, uid: 0, people: [], ex: [], g: { organizer: '', name: '', date: '', budget: '', message: '' }, org: null, poll: null };

  /* ---------- utilidades de UI ---------- */
  var views = ['wizard', 'results', 'reveal', 'error', 'loading'];
  function show(v) { views.forEach(function (n) { $('view-' + n).hidden = n !== v; }); window.scrollTo({ top: 0 }); }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.hidden = true; }, 2400);
  }
  function err(id, msg) { var e = $(id); if (!msg) { e.hidden = true; return; } e.textContent = msg; e.hidden = false; }
  function link(tok, kind) { return BASE + '?' + kind + '=' + encodeURIComponent(tok) + (API.mode === 'demo' ? '&demo=1' : ''); }
  function copy(text, ok) {
    var done = function () { toast(ok || 'Enlace copiado'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); } ta.remove();
    }
  }
  function fmtDate(iso) {
    var d = new Date(iso + 'T12:00:00'); if (isNaN(d)) return iso;
    return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtMoney(n) {
    var v = Number(n); if (!isFinite(v) || v <= 0) return 'Libre';
    return '$' + (v % 1 ? v.toFixed(2) : v.toFixed(0)) + ' USD';
  }
  function todayISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  /* ---------- Stepper ---------- */
  function go(step) {
    S.step = step;
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = Number(p.dataset.panel) !== step; });
    document.querySelectorAll('#stepper li').forEach(function (li) {
      var n = Number(li.dataset.step); li.classList.toggle('active', n === step); li.classList.toggle('done', n < step);
    });
    if (step === 3) renderStep3();
    if (step === 4) renderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Paso 1: participantes ---------- */
  function addNames(raw) {
    var parts = String(raw).split(/[,;\n]+/).map(norm).filter(Boolean), added = 0, msg = '';
    parts.forEach(function (n) {
      if (n.length > 40) n = n.slice(0, 40);
      if (S.people.some(function (p) { return key(p.name) === key(n); })) { msg = '“' + n + '” ya está en la lista. Si hay dos personas con el mismo nombre, agrega una inicial (Ana M.).'; return; }
      if (S.people.length >= MAX_PEOPLE) { msg = 'El máximo es ' + MAX_PEOPLE + ' participantes.'; return; }
      S.people.push({ id: ++S.uid, name: n, wish: '' }); added++;
    });
    err('err-1', msg); renderPeople(); return added;
  }
  function renderPeople() {
    var ul = $('people-list'); ul.innerHTML = '';
    S.people.forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(p.name) + '</span><button type="button" aria-label="Quitar a ' + esc(p.name) + '">✕</button>';
      li.querySelector('button').addEventListener('click', function () {
        S.people = S.people.filter(function (x) { return x.id !== p.id; });
        S.ex = S.ex.filter(function (e) { return e[0] !== p.id && e[1] !== p.id; });
        renderPeople();
      });
      ul.appendChild(li);
    });
    var n = S.people.length;
    $('count-line').textContent = n ? n + (n === 1 ? ' participante' : ' participantes') + (n < MIN_PEOPLE ? ' · faltan ' + (MIN_PEOPLE - n) + ' para poder sortear' : '') : 'Aún no hay participantes';
  }
  $('add-name').addEventListener('click', function () { var i = $('name-input'); if (addNames(i.value)) i.value = ''; i.focus(); });
  $('name-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('add-name').click(); } });
  $('name-input').addEventListener('paste', function (e) {
    var t = (e.clipboardData || window.clipboardData).getData('text');
    if (/[,;\n]/.test(t)) { e.preventDefault(); addNames(t); }
  });
  $('next-1').addEventListener('click', function () {
    var pending = $('name-input').value.trim(); if (pending) { addNames(pending); $('name-input').value = ''; }
    if (S.people.length < MIN_PEOPLE) return err('err-1', 'Necesitas al menos ' + MIN_PEOPLE + ' participantes para hacer el sorteo.');
    err('err-1'); go(2);
  });

  /* ---------- Paso 2: datos del grupo ---------- */
  $('f-date').min = todayISO();
  $('f-message').addEventListener('input', function () { $('msg-count').textContent = this.value.length; });
  $('next-2').addEventListener('click', function () {
    var g = S.g;
    g.organizer = norm($('f-organizer').value); g.name = norm($('f-group').value); g.date = $('f-date').value;
    g.budget = $('f-budget').value; g.message = $('f-message').value.trim();
    if (!g.organizer) return err('err-2', 'Escribe tu nombre como organizador.');
    if (!g.name) return err('err-2', 'Ponle un nombre al grupo.');
    if (!g.date) return err('err-2', 'Elige la fecha del intercambio.');
    if (g.date < todayISO()) return err('err-2', 'La fecha del intercambio no puede estar en el pasado.');
    if (g.budget === '' || Number(g.budget) < 0) return err('err-2', 'Indica un presupuesto (puede ser 0 si es libre).');
    err('err-2'); go(3);
  });

  /* ---------- Paso 3: exclusiones y deseos ---------- */
  function renderStep3() {
    var a = $('ex-a'), b = $('ex-b'), opts = S.people.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('');
    var av = a.value, bv = b.value; a.innerHTML = opts; b.innerHTML = opts;
    if (av) a.value = av; if (bv) b.value = bv; else if (S.people[1]) b.value = S.people[1].id;
    renderEx();
    var w = $('wish-list'); w.innerHTML = '';
    S.people.forEach(function (p) {
      var l = document.createElement('label');
      l.innerHTML = '<span>' + esc(p.name) + '</span><input type="text" maxlength="200" placeholder="Ej. libros, café, algo azul…">';
      var inp = l.querySelector('input'); inp.value = p.wish;
      inp.addEventListener('input', function () { p.wish = inp.value; });
      w.appendChild(l);
    });
  }
  function nameOf(id) { var p = S.people.filter(function (x) { return x.id === id; })[0]; return p ? p.name : '?'; }
  function renderEx() {
    var ul = $('ex-list'); ul.innerHTML = '';
    S.ex.forEach(function (e, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(nameOf(e[0])) + ' ✕ ' + esc(nameOf(e[1])) + '</span><button type="button" aria-label="Quitar exclusión">✕</button>';
      li.querySelector('button').addEventListener('click', function () { S.ex.splice(i, 1); renderEx(); });
      ul.appendChild(li);
    });
  }
  $('add-ex').addEventListener('click', function () {
    var a = Number($('ex-a').value), b = Number($('ex-b').value);
    if (a === b) return err('err-3', 'Elige dos personas distintas.');
    if (S.ex.some(function (e) { return (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a); })) return err('err-3', 'Esa exclusión ya está.');
    S.ex.push([a, b]); err('err-3'); renderEx();
  });
  function idxPairs() {
    var idx = {}; S.people.forEach(function (p, i) { idx[p.id] = i; });
    return S.ex.map(function (e) { return [idx[e[0]], idx[e[1]]]; });
  }
  $('next-3').addEventListener('click', function () {
    if (!API.feasible(S.people.length, idxPairs())) return err('err-3', 'Con esas exclusiones el sorteo no tiene solución. Quita alguna e inténtalo de nuevo.');
    err('err-3'); go(4);
  });

  /* ---------- Paso 4: resumen y sorteo ---------- */
  function renderSummary() {
    var g = S.g;
    $('summary').innerHTML =
      '<div><span class="k">Grupo</span><b>' + esc(g.name) + '</b></div>' +
      '<div><span class="k">Organizador</span><b>' + esc(g.organizer) + '</b></div>' +
      '<div><span class="k">Fecha</span><b>' + esc(fmtDate(g.date)) + '</b></div>' +
      '<div><span class="k">Presupuesto</span><b>' + esc(fmtMoney(g.budget)) + '</b></div>' +
      '<div><span class="k">Participantes</span><b>' + S.people.length + '</b></div>' +
      '<div><span class="k">Exclusiones</span><b>' + S.ex.length + '</b></div>';
  }
  $('c-marketing').addEventListener('change', function () { $('contact-field').hidden = !this.checked; });
  $('do-draw').addEventListener('click', function () {
    var btn = this;
    if (!$('c-privacy').checked) return err('err-4', 'Para continuar debes aceptar el aviso de privacidad.');
    var marketing = $('c-marketing').checked, contact = norm($('f-contact').value);
    if (marketing && !contact) return err('err-4', 'Escribe tu WhatsApp o correo, o desmarca la casilla de novedades.');
    if (!API.ready) return err('err-4', 'El servicio de sorteo todavía se está conectando. Vuelve en unos minutos.');
    err('err-4'); btn.disabled = true; btn.textContent = 'Sorteando…';
    API.createDraw({
      group_name: S.g.name, organizer: S.g.organizer, event_date: S.g.date, budget: Number(S.g.budget) || 0, message: S.g.message,
      participants: S.people.map(function (p) { return { name: p.name, wish: norm(p.wish) }; }),
      exclusions: idxPairs(), contact: marketing ? contact : null, marketing: marketing
    }).then(function (r) {
      try { localStorage.setItem(ORG_KEY, r.organizer_token); } catch (e) {}
      S.org = { token: r.organizer_token, links: r.participants };
      return loadOrganizer(r.organizer_token, r.participants);
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '🎁 Hacer el sorteo';
      err('err-4', e.code === 'NO_SOLUTION' ? 'No se pudo armar el sorteo con esas exclusiones. Quita alguna e inténtalo otra vez.'
        : e.code === 'NETWORK' ? 'Sin conexión. Revisa tu internet e inténtalo de nuevo.' : 'No pudimos hacer el sorteo. Inténtalo de nuevo en un momento.');
    });
  });

  /* ---------- Panel del organizador ---------- */
  var linkMap = {};   // token -> link
  function loadOrganizer(orgToken, firstLinks) {
    return API.organizerStatus(orgToken).then(function (st) {
      $('res-title').textContent = st.group_name;
      $('res-sub').textContent = 'Organiza ' + st.organizer + ' · ' + fmtDate(st.event_date) + ' · ' + fmtMoney(st.budget);
      $('org-link').value = link(orgToken, 'o');
      renderLinks(st);
      show('results');
      clearInterval(S.poll); S.poll = setInterval(function () { refresh(true); }, 30000);
      S.orgToken = orgToken; S.st = st;
    });
  }
  function renderLinks(st) {
    var ul = $('links-list'); ul.innerHTML = '';
    st.participants.forEach(function (p) {
      var url = link(p.token, 't'), li = document.createElement('li');
      var msg = 'Hola ' + p.name + '! 🎄 ' + st.organizer + ' te invita al amigo secreto “' + st.group_name + '”. ' +
        'Descubre a quién le regalas aquí (es solo para ti): ' + url;
      li.innerHTML = '<div class="who"><strong>' + esc(p.name) + '</strong><span class="badge' + (p.opened ? ' ok' : '') + '">' + (p.opened ? 'Ya abrió ✓' : 'Sin abrir') + '</span></div>' +
        '<div class="acts"><button type="button" class="btn btn-blue btn-sm" data-c>Copiar enlace</button>' +
        '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">Enviar por WhatsApp</a></div>';
      li.querySelector('[data-c]').addEventListener('click', function () { copy(url, 'Enlace de ' + p.name + ' copiado'); });
      ul.appendChild(li);
    });
  }
  function refresh(silent) {
    if (!S.orgToken) return;
    API.organizerStatus(S.orgToken).then(function (st) { renderLinks(st); if (!silent) toast('Estado actualizado'); }, function () { if (!silent) toast('No se pudo actualizar'); });
  }
  $('refresh').addEventListener('click', function () { refresh(false); });
  $('copy-org').addEventListener('click', function () { copy($('org-link').value, 'Enlace de organizador copiado'); });
  $('new-draw').addEventListener('click', function () {
    if (!confirm('¿Empezar un sorteo nuevo? Guarda antes tu enlace de organizador si quieres volver a este.')) return;
    try { localStorage.removeItem(ORG_KEY); } catch (e) {}
    location.href = BASE + (API.mode === 'demo' ? '?demo=1' : '');
  });

  /* ---------- Revelación ---------- */
  var REV = null;
  function startReveal(tok) {
    API.reveal(tok).then(function (r) {
      REV = r;
      $('rv-hello').textContent = 'Hola, ' + r.giver;
      $('rv-friend').textContent = r.receiver;
      $('rv-group').textContent = r.group_name;
      $('rv-date').textContent = fmtDate(r.event_date);
      $('rv-budget').textContent = fmtMoney(r.budget);
      if (r.wish) { $('rv-wish').textContent = r.wish; $('rv-wish-wrap').hidden = false; }
      if (r.message) { $('rv-msg').textContent = r.message; $('rv-org').textContent = r.organizer; $('rv-msg-wrap').hidden = false; }
      var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
      show('reveal');
    }).catch(function (e) { fail(e.code === 'NOT_FOUND' ? 'Enlace no válido' : 'No pudimos cargarlo',
      e.code === 'NOT_FOUND' ? 'Este enlace no existe o el grupo ya fue borrado después del intercambio. Pídele al organizador que te lo reenvíe.' : 'Revisa tu conexión e inténtalo otra vez.'); });
  }
  function openGift() {
    var gift = $('gift'); if (gift.classList.contains('open')) return;
    gift.classList.add('open'); $('rv-tap').hidden = true; FX.confetti();
    setTimeout(function () {
      $('stage').classList.add('gone');
      setTimeout(function () { $('stage').hidden = true; $('reveal-card').hidden = false; $('rv-cta').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }, 450);
    }, 1100);
  }
  $('gift').addEventListener('click', openGift);
  $('gift').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGift(); } });
  $('hide-card').addEventListener('click', function () { $('reveal-card').hidden = true; $('reveal-hidden').hidden = false; });
  $('show-card').addEventListener('click', function () { $('reveal-hidden').hidden = true; $('reveal-card').hidden = false; });
  $('dl-card').addEventListener('click', function () {
    if (!REV) return; var b = this; b.disabled = true;
    FX.cardBlob({ receiver: REV.receiver, group_name: REV.group_name, dateText: fmtDate(REV.event_date), budgetText: fmtMoney(REV.budget), wish: REV.wish })
      .then(function (blob) {
        var file = new File([blob], 'mi-amigo-secreto.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          return navigator.share({ files: [file], title: 'Mi amigo secreto' }).catch(function () {});
        }
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mi-amigo-secreto.png';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      }).catch(function () { err('err-r', 'No se pudo crear la tarjeta. Inténtalo otra vez.'); })
      .then(function () { b.disabled = false; });
  });

  /* ---------- Errores, privacidad, arranque ---------- */
  function fail(title, text) { $('er-title').textContent = title; $('er-text').textContent = text; show('error'); }
  function modal(open) { $('privacy-modal').hidden = !open; document.body.style.overflow = open ? 'hidden' : ''; }
  ['open-privacy', 'open-privacy-2'].forEach(function (id) { $(id).addEventListener('click', function () { modal(true); }); });
  $('close-privacy').addEventListener('click', function () { modal(false); });
  $('privacy-modal').addEventListener('click', function (e) { if (e.target === this) modal(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal(false); });
  document.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { go(Number(b.dataset.back)); }); });

  function boot() {
    FX.snow();
    if (API.mode === 'demo') $('demo-banner').hidden = false;
    renderPeople();
    var t = qs.get('t'), o = qs.get('o');
    if (t) { if (!API.ready) return fail('Casi listo', 'InSecret se está conectando. Vuelve a abrir tu enlace en unos minutos.'); return startReveal(t); }
    var saved = null; try { saved = localStorage.getItem(ORG_KEY); } catch (e) {}
    var tok = o || saved;
    if (tok && API.ready) {
      return loadOrganizer(tok).catch(function () {
        try { localStorage.removeItem(ORG_KEY); } catch (e) {}
        if (o) return fail('Enlace de organizador no válido', 'No encontramos ese grupo. Puede que ya se haya borrado después del intercambio.');
        show('wizard'); go(1);
      });
    }
    show('wizard'); go(1);
  }
  boot();
})();
