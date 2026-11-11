/* Compra y edición de invitaciones personales · Poseidón */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = window.INSECRET_CONFIG || {}, DEF = window.INV_DEF || {};
  var MODE = document.body.dataset.mode, EDIT = MODE === 'edit';
  var FN = C.supabaseUrl + '/functions/v1/compra';
  var PRICE = { navidad: 12.9, fin: 12.9, cumple: 12.9, cita: 12.9 };
  var NAMES = { navidad: 'Cena navideña', fin: 'Fin de año', cumple: 'Cumpleaños', cita: 'Cita romántica' };
  var THEMES = ['navidad', 'fin', 'cumple', 'cita'];
  var QS = new URLSearchParams(location.search);
  var theme = THEMES.indexOf(QS.get('t')) >= 0 ? QS.get('t') : 'navidad', TOKEN = (QS.get('e') || '').replace(/[^A-Za-z0-9_-]/g, ''), step = 1, ready = false, lastDef = null, busy = false;
  var frame = $('pv-frame'), pal = 0;
  /* ---------- paletas de color ---------- */
  function renderPal() {
    var box = $('pal'), P = window.INS_PAL; if (!box || !P) return; box.innerHTML = '';
    for (var i = 0; i < P.count; i++) {
      var l = P.list[theme] && P.list[theme][i]; if (!l) continue;
      var b = document.createElement('button'); b.type = 'button'; b.dataset.p = i; b.setAttribute('aria-pressed', String(i === pal)); b.setAttribute('aria-label', 'Paleta ' + l.n);
      b.innerHTML = '<span class="dots">' + P.dots(theme, i).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><em>' + esc(l.n) + '</em>';
      box.appendChild(b);
    }
  }
  if ($('pal')) $('pal').addEventListener('click', function (e) { var b = e.target.closest('button[data-p]'); if (!b) return; pal = +b.dataset.p; renderPal(); sendPreview(); });

  function money(n) { return '$' + n.toFixed(2).replace('.', ','); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2400); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function call(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { error: 'SERVER' }; }); }, function () { return { error: 'NETWORK' }; });
  }
  var ERR = {
    NETWORK: 'Sin conexión. Revisa tu internet e inténtalo otra vez.', SERVER: 'Algo falló de nuestro lado. Inténtalo en un momento.', LINK: 'No pudimos preparar el pago. Inténtalo otra vez en un minuto.',
    RATE: 'Ya intentaste varias veces seguidas. Espera un rato o escríbenos a soporte@poseidonmk.com.', BAD_EMAIL: 'Revisa tu correo: parece que le falta algo.', BAD_NAME: 'Escribe tu nombre.', BAD_DOC: 'La cédula debe tener 10 números o el RUC 13.',
    BAD_DATE: 'La fecha del evento debe ser futura (al menos dentro de una hora).', NO_TITLE: 'Falta el título de la invitación.', NOT_READY: 'El pago se está terminando de configurar. Escríbenos por WhatsApp y te ayudamos.',
    NOT_FOUND: 'No encontramos esta invitación. Revisa el enlace del correo.', LOCKED: 'El evento ya empezó: ya no se puede editar.', NO_EDITS: 'Ya usaste tus 5 ediciones. Escríbenos si necesitas un cambio.'
  };
  function showErr(n, t) { var e = $('e' + n); e.textContent = t; e.hidden = false; e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function clearErr() { [1, 2, 3, 4].forEach(function (n) { $('e' + n).hidden = true; }); [].forEach.call(document.querySelectorAll('.bad'), function (x) { x.classList.remove('bad'); }); }
  function bad(id) { $(id).classList.add('bad'); }

  /* ---------- filas dinámicas ---------- */
  function rowIt(t, x) { var d = document.createElement('div'); d.className = 'rw'; d.innerHTML = '<input type="time" value="' + esc(t || '') + '" aria-label="Hora"><input type="text" maxlength="80" value="' + esc(x || '') + '" placeholder="Qué pasa" aria-label="Momento"><button type="button" class="x" aria-label="Quitar">✕</button>'; d.querySelector('.x').onclick = function () { d.remove(); push(); }; $('it-rows').appendChild(d); }
  function rowMe(a, b) { var d = document.createElement('div'); d.className = 'rw me'; d.innerHTML = '<input type="text" maxlength="30" value="' + esc(a || '') + '" placeholder="Entrada" aria-label="Tipo"><input type="text" maxlength="90" value="' + esc(b || '') + '" placeholder="Plato" aria-label="Plato"><button type="button" class="x" aria-label="Quitar">✕</button>'; d.querySelector('.x').onclick = function () { d.remove(); push(); }; $('me-rows').appendChild(d); }
  $('it-add').onclick = function () { if ($('it-rows').children.length < 10) rowIt('', ''); };
  $('me-add').onclick = function () { if ($('me-rows').children.length < 8) rowMe('', ''); };
  function rowsOf(box) { return [].map.call(box.children, function (r) { var i = r.querySelectorAll('input'); return [i[0].value.trim(), i[1].value.trim()]; }).filter(function (r) { return r[1]; }); }

  /* ---------- valores de ejemplo por ocasión ---------- */
  var SEEDED = ['it', 'menu', 'dress', 'xt', 'xx', 'rq', 'ry', 'rn', 'to', 'lead', 'msg'];
  function snapshot() { return { to: $('f-to').value, lead: $('f-lead').value, msg: $('f-msg').value, it: JSON.stringify(rowsOf($('it-rows'))), menu: JSON.stringify(rowsOf($('me-rows'))), dress: $('f-dress').value, c: [$('c1').value, $('c2').value, $('c3').value].join(), xt: $('f-xt').value, xx: $('f-xx').value, rq: $('f-rq').value, ry: $('f-ry').value, rn: $('f-rn').value }; }
  function defOf(k) {
    var d = DEF[k] || {}, cs = (d.dress && d.dress[1]) || [];
    return { to: d.to || '', lead: d.lead || '', msg: d.msg || '', it: JSON.stringify((d.it || []).filter(function (r) { return r[1]; })), menu: JSON.stringify((d.menu || []).filter(function (r) { return r[1]; })), dress: (d.dress && d.dress[0]) || '', c: [cs[0] || '#888888', cs[1] || '#aaaaaa', cs[2] || '#cccccc'].join(), xt: (d.extra && d.extra[1]) || '', xx: (d.extra && d.extra[2]) || '', rq: (d.rsvp && d.rsvp[0]) || '¿Nos acompañas?', ry: (d.rsvp && d.rsvp[1]) || 'Sí, voy', rn: (d.rsvp && d.rsvp[2]) || 'No puedo' };
  }
  /* cambia a los ejemplos de la ocasión solo donde el usuario no escribió nada propio */
  function seed(k) {
    var d = defOf(k), cur = snapshot(), old = lastDef;
    function untouched(f) { return old === null || cur[f] === '' || cur[f] === old[f]; }
    if (untouched('to')) $('f-to').value = d.to;
    if (untouched('lead')) $('f-lead').value = d.lead;
    if (untouched('msg')) $('f-msg').value = d.msg;
    if (untouched('it')) { $('it-rows').innerHTML = ''; JSON.parse(d.it).forEach(function (r) { rowIt(r[0], r[1]); }); }
    if (untouched('menu')) { $('me-rows').innerHTML = ''; JSON.parse(d.menu).forEach(function (r) { rowMe(r[0], r[1]); }); }
    if (untouched('dress')) $('f-dress').value = d.dress;
    if (old === null || cur.c === old.c) { var cs = d.c.split(','); $('c1').value = cs[0]; $('c2').value = cs[1]; $('c3').value = cs[2]; }
    if (untouched('xt')) $('f-xt').value = d.xt;
    if (untouched('xx')) $('f-xx').value = d.xx;
    if (untouched('rq')) $('f-rq').value = d.rq;
    if (untouched('ry')) $('f-ry').value = d.ry;
    if (untouched('rn')) $('f-rn').value = d.rn;
    var ex = DEF[k] || {};
    $('f-title').placeholder = ex.title || ''; $('f-host').placeholder = ex.host || ''; $('f-place').placeholder = ex.place || ''; $('f-mapq').placeholder = ex.mapq || '';
    lastDef = d;
  }

  /* ---------- configuración que se envía y que se ve en la vista previa ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function config(forPreview) {
    var ex = DEF[theme] || {}, v = function (id, fb) { var s = $(id).value.trim(); return s || (forPreview ? fb : ''); };
    var date = $('f-date').value || (forPreview ? ex.date : '');
    var cfg = {
      lead: v('f-lead', ex.lead || ''), to: v('f-to', ex.to || ''), host: v('f-host', ex.host || ''), title: v('f-title', ex.title || ''), msg: v('f-msg', ex.msg || ''),
      date: date, place: v('f-place', ex.place || ''), mapq: v('f-mapq', ex.mapq || ''), maplink: $('f-maplink').value.trim(), noguests: !$('f-guests').checked,
      it: rowsOf($('it-rows')), menu: rowsOf($('me-rows')),
      dress: [$('f-dress').value.trim(), [$('c1').value, $('c2').value, $('c3').value]],
      extra: ['gi', $('f-xt').value.trim(), $('f-xx').value.trim()],
      rsvp: [$('f-rq').value.trim() || '¿Nos acompañas?', $('f-ry').value.trim() || 'Sí, voy', $('f-rn').value.trim() || 'No puedo'], pal: pal
    };
    /* fin de año: la cuenta regresiva llega a la medianoche solo si el evento es el 31 de diciembre */
    if (theme === 'fin' && /-12-31T/.test(date)) { var y = +date.slice(0, 4) + 1; cfg.target = y + '-01-01T00:00'; }
    return cfg;
  }
  var timer = null;
  function push() { clearTimeout(timer); timer = setTimeout(sendPreview, 450); }
  function sendPreview() { if (!ready || !frame.contentWindow) return; try { frame.contentWindow.postMessage({ type: 'ins-preview', theme: theme, cfg: config(true) }, location.origin); } catch (e) {} }
  window.addEventListener('message', function (e) { if (e.origin === location.origin && e.data && e.data.type === 'ins-ready') { ready = true; sendPreview(); setTimeout(function () { focusPv(lastT || 'top'); }, 600); } });
  function loadFrame() { ready = false; frame.src = '../invitacion/?preview=1&t=' + theme; }
  document.addEventListener('input', function (e) { if (e.target.closest('.panel')) push(); });
  document.addEventListener('change', function (e) { if (e.target.closest('.panel')) push(); });

  /* ---------- la vista previa sigue lo que editas ---------- */
  var lastT = '';
  function focusPv(t) { lastT = t; if (!ready) return; try { frame.contentWindow.postMessage({ type: 'ins-focus', target: t }, location.origin); } catch (e) {} }
  function targetOf(el) {
    var id = el.id || '', r = el.closest('#it-rows') ? 'it' : el.closest('#me-rows') ? 'me' : '';
    if (r) return r;
    if (/^(f-title|f-host|f-to|f-lead|f-msg)$/.test(id)) return 'top';
    if (id === 'f-date') return 'when';
    if (/^(f-place|f-mapq|f-maplink)$/.test(id)) return 'pl';
    if (/^(f-dress|c1|c2|c3)$/.test(id)) return 'dr';
    if (/^(f-xt|f-xx)$/.test(id)) return 'ex';
    if (/^(f-rq|f-ry|f-rn|f-guests)$/.test(id) || el.closest('#p3 .fld:last-of-type')) return 'rsvp';
    return '';
  }
  document.addEventListener('focusin', function (e) { var t = e.target; if (!t.closest || !t.closest('.panel')) return; var g = targetOf(t); if (g && g !== lastT) { clearTimeout(ft); ft = setTimeout(function () { focusPv(g); }, 250); } });
  var ft = null;

  /* ---------- pasos ---------- */
  function go(n) {
    step = n; [1, 2, 3, 4].forEach(function (i) { $('p' + i).hidden = i !== n; });
    [].forEach.call($('stepper').children, function (li, i) { li.className = i + 1 < n ? 'done' : (i + 1 === n ? 'on' : ''); });
    focusPv(n === 1 ? 'top' : n === 2 ? 'when' : n === 3 ? 'it' : 'rsvp');
    window.scrollTo({ top: Math.max(0, $('stepper').getBoundingClientRect().top + scrollY - 70), behavior: 'smooth' });
  }
  function check(n) {
    clearErr(); var cfg = config(false);
    if (n === 1) {
      if (!cfg.title) { bad('f-title'); showErr(1, 'Escribe el título de tu invitación.'); return false; }
      if (!cfg.host) { bad('f-host'); showErr(1, 'Escribe quién invita (por ejemplo: «La familia Andrade te invita a la»).'); return false; }
    }
    if (n === 2) {
      if (!cfg.date) { bad('f-date'); showErr(2, 'Elige la fecha y la hora del evento.'); return false; }
      if (new Date(cfg.date + ':00-05:00').getTime() < Date.now() + 3600e3) { bad('f-date'); showErr(2, ERR.BAD_DATE); return false; }
      if (!cfg.place) { bad('f-place'); showErr(2, 'Escribe el nombre del lugar.'); return false; }
      if (cfg.maplink && !/^https:\/\/\S+$/.test(cfg.maplink)) { bad('f-maplink'); showErr(2, 'El enlace del mapa debe empezar con https://'); return false; }
    }
    if (n === 3 && !cfg.it.length) { showErr(3, 'Agrega al menos un momento al programa (por ejemplo la hora de llegada).'); return false; }
    return true;
  }
  [].forEach.call(document.querySelectorAll('[data-go]'), function (b) {
    b.addEventListener('click', function () { var to = +b.dataset.go; if (to > step) { for (var i = step; i < to; i++) if (!check(i)) { go(i); return; } } go(to); if (to === 4 && !EDIT) summary(); });
  });
  function summary() { var b = PRICE[theme], iva = Math.round(b * 15) / 100, t = Math.round((b + iva) * 100) / 100; $('sum-name').textContent = 'Invitación · ' + NAMES[theme]; $('sum-price').textContent = money(b) + ' + IVA'; $('sum-iva').textContent = 'Subtotal ' + money(b) + ' · IVA 15% ' + money(iva) + ' · Total a pagar ' + money(t); $('pay-price').textContent = money(t); }

  /* ---------- ocasión ---------- */
  function setTheme(k) {
    theme = k; pal = 0; renderPal(); [].forEach.call(document.querySelectorAll('#occ button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === k)); });
    seed(k); loadFrame(); if (!EDIT) summary();
    try { history.replaceState(null, '', '?t=' + k); } catch (e) {}
  }
  if (!EDIT) $('occ').addEventListener('click', function (e) { var b = e.target.closest('button[data-t]'); if (b && b.dataset.t !== theme) setTheme(b.dataset.t); });

  /* ---------- vista previa en celular ---------- */
  $('pv-open').onclick = function () { $('pv').classList.add('open'); sendPreview(); };
  $('pv-env').onclick = function () { try { frame.contentWindow.postMessage({ type: 'ins-close' }, location.origin); } catch (e) {} };
  $('pv-close').onclick = function () { $('pv').classList.remove('open'); };

  /* ---------- fecha mínima ---------- */
  (function () { var z = new Date(Date.now() + 2 * 3600e3 - 5 * 3600e3); $('f-date').min = z.getUTCFullYear() + '-' + pad(z.getUTCMonth() + 1) + '-' + pad(z.getUTCDate()) + 'T' + pad(z.getUTCHours()) + ':' + pad(z.getUTCMinutes()); })();
  document.addEventListener('click', function (e) { var i = e.target; if (i && i.tagName === 'INPUT' && /^(datetime-local|time)$/.test(i.type) && i.showPicker) { try { i.showPicker(); } catch (x) {} } });

  /* ---------- pagar ---------- */
  if (!EDIT) $('pay').addEventListener('click', function () {
    if (busy) return; clearErr();
    for (var i = 1; i <= 3; i++) if (!check(i)) { go(i); return; }
    var name = $('b-name').value.trim(), email = $('b-email').value.trim(), doc = $('b-doc').value.replace(/\D/g, '');
    if (name.length < 2) { bad('b-name'); return showErr(4, ERR.BAD_NAME); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { bad('b-email'); return showErr(4, ERR.BAD_EMAIL); }
    if (doc && !/^(\d{10}|\d{13})$/.test(doc)) { bad('b-doc'); return showErr(4, ERR.BAD_DOC); }
    if (!$('b-terms').checked) return showErr(4, 'Marca la casilla para confirmar que revisaste tu invitación.');
    busy = true; var btn = $('pay'); btn.disabled = true; btn.firstChild.textContent = 'Preparando tu pago… ';
    call({ action: 'crear', theme: theme, config: config(false), name: name, email: email, phone: $('b-phone').value, doc: doc, web: $('b-web').value }).then(function (r) {
      busy = false; btn.disabled = false; btn.firstChild.textContent = 'Continuar al pago · ';
      if (!r.ok || !r.code) return showErr(4, ERR[r.error] || ERR.SERVER);
      try { localStorage.setItem('ins_order', r.code); } catch (e) {}
      location.href = '../pedido/?c=' + encodeURIComponent(r.code);
    });
  });

  /* ---------- modo edición ---------- */
  function fillFrom(cfg) {
    var set = function (id, v) { $(id).value = v == null ? '' : v; };
    set('f-title', cfg.title); set('f-host', cfg.host); set('f-to', cfg.to); set('f-lead', cfg.lead); set('f-msg', cfg.msg); set('f-date', cfg.date); set('f-place', cfg.place); set('f-mapq', cfg.mapq); set('f-maplink', cfg.maplink);
    $('it-rows').innerHTML = ''; (cfg.it || []).forEach(function (r) { rowIt(r[0], r[1]); }); $('me-rows').innerHTML = ''; (cfg.menu || []).forEach(function (r) { rowMe(r[0], r[1]); });
    set('f-dress', cfg.dress && cfg.dress[0]); var cs = (cfg.dress && cfg.dress[1]) || []; $('c1').value = cs[0] || '#888888'; $('c2').value = cs[1] || '#aaaaaa'; $('c3').value = cs[2] || '#cccccc';
    set('f-xt', cfg.extra && cfg.extra[1]); set('f-xx', cfg.extra && cfg.extra[2]);
    var rs = cfg.rsvp || []; set('f-rq', rs[0]); set('f-ry', rs[1]); set('f-rn', rs[2]); $('f-guests').checked = !cfg.noguests;
  }
  function initEdit() {
    if (!TOKEN) { $('edit-title').textContent = ERR.NOT_FOUND; document.querySelector('.cr').hidden = true; return; }
    call({ action: 'editar_get', token: TOKEN }).then(function (r) {
      if (r.error || !r.config) { $('edit-title').textContent = ERR[r.error] || ERR.SERVER; document.querySelector('.cr').hidden = true; return; }
      theme = THEMES.indexOf(r.theme) >= 0 ? r.theme : 'navidad'; fillFrom(r.config); pal = Math.max(0, Math.min(3, +r.config.pal || 0)); renderPal(); lastDef = defOf(theme);
      $('edit-title').textContent = NAMES[theme] + ' · ' + (r.config.title || ''); $('edits-left').textContent = r.edits_left;
      if (r.locked) { $('edit-title').textContent = ERR.LOCKED; document.querySelector('.cr').hidden = true; return; }
      if (r.edits_left <= 0) { $('save').disabled = true; showErr(4, ERR.NO_EDITS); }
      loadFrame(); go(1);
      $('save').addEventListener('click', function () {
        if (busy) return; for (var i = 1; i <= 3; i++) if (!check(i)) { go(i); return; }
        busy = true; $('save').disabled = true; $('save').textContent = 'Guardando…';
        call({ action: 'editar_guardar', token: TOKEN, config: config(false) }).then(function (s) {
          busy = false; $('save').textContent = 'Guardar cambios';
          if (!s.ok) { $('save').disabled = false; return showErr(4, ERR[s.error] || ERR.SERVER); }
          $('edits-left').textContent = s.edits_left; $('save').disabled = s.edits_left <= 0;
          var m = $('saved'); m.hidden = false; m.innerHTML = '✅ Cambios guardados. Te quedan ' + s.edits_left + ' ediciones. <a href="../invitacion/?i=' + esc(s.slug) + '" target="_blank" rel="noopener" style="color:var(--oro)">Ver mi invitación</a>';
        });
      });
    });
  }

  /* ---------- arranque ---------- */
  if (EDIT) { document.querySelector('.cr').hidden = false; initEdit(); }
  else { renderPal(); seed(theme); [].forEach.call(document.querySelectorAll('#occ button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === theme)); }); loadFrame(); summary(); go(1); }
})();
