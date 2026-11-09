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

  var S = { step: 1, uid: 0, people: [], ex: [], g: { organizer: '', name: '', date: '', budget: '', message: '' }, orgToken: null, poll: null, tok: null, phone: null };

  /* ---------- Sorteos guardados en este navegador (solo comodidad) ---------- */
  function getSaved() {
    var raw = null, list = [];
    try { raw = localStorage.getItem(ORG_KEY); } catch (e) {}
    if (!raw) return list;
    try { var v = JSON.parse(raw); if (Array.isArray(v)) list = v.filter(function (x) { return x && x.t; }); }
    catch (e) { list = [{ t: raw, n: 'Tu sorteo' }]; } // formato anterior: solo el token
    return list;
  }
  function putSaved(list) { try { localStorage.setItem(ORG_KEY, JSON.stringify(list.slice(0, 10))); } catch (e) {} }
  function addSaved(t, n) { var l = getSaved().filter(function (x) { return x.t !== t; }); l.unshift({ t: t, n: n || 'Tu sorteo' }); putSaved(l); }
  function removeSaved(t) { putSaved(getSaved().filter(function (x) { return x.t !== t; })); }

  /* ---------- utilidades de UI ---------- */
  var views = ['wizard', 'results', 'recover', 'group', 'reveal', 'error', 'loading'];
  function show(v) { views.forEach(function (n) { $('view-' + n).hidden = n !== v; }); window.scrollTo({ top: 0 }); }
  function noindex() { var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m); }
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
  function go(step, quiet) {
    S.step = step;
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = Number(p.dataset.panel) !== step; });
    document.querySelectorAll('#stepper li').forEach(function (li) {
      var n = Number(li.dataset.step); li.classList.toggle('active', n === step); li.classList.toggle('done', n < step);
    });
    if (step === 3) renderStep3();
    if (step === 4) renderSummary();
    if (!quiet) $('stepper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Paso 1: participantes ---------- */
  function addNames(raw) {
    var parts = String(raw).split(/[,;\n]+/).map(norm).filter(Boolean), added = 0, msg = '';
    parts.forEach(function (n) {
      if (n.length > 40) n = n.slice(0, 40);
      if (S.people.some(function (p) { return key(p.name) === key(n); })) { msg = '“' + n + '” ya está en la lista. Si hay dos personas con el mismo nombre, agrega una inicial (Ana M.).'; return; }
      if (S.people.length >= MAX_PEOPLE) { msg = 'El máximo es ' + MAX_PEOPLE + ' participantes.'; return; }
      S.people.push({ id: ++S.uid, name: n }); added++;
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

  /* ---------- Paso 3: exclusiones ---------- */
  function renderStep3() {
    var a = $('ex-a'), b = $('ex-b');
    var opts = S.people.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('');
    a.innerHTML = '<option value="">Persona 1</option>' + opts;
    b.innerHTML = '<option value="">Persona 2</option>' + opts;
    renderEx();
  }
  function nameOf(id) { var p = S.people.filter(function (x) { return x.id === id; })[0]; return p ? p.name : '?'; }
  function renderEx() {
    var ul = $('ex-list'), n = S.ex.length; ul.innerHTML = '';
    $('ex-box').classList.toggle('has', n > 0);
    $('ex-count').textContent = n === 0
      ? 'Aquí irán apareciendo tus exclusiones. Tienes 0 exclusiones.'
      : 'Tienes ' + n + (n === 1 ? ' exclusión:' : ' exclusiones:');
    S.ex.forEach(function (e, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(nameOf(e[0])) + ' ✕ ' + esc(nameOf(e[1])) + '</span><button type="button" aria-label="Quitar exclusión">✕</button>';
      li.querySelector('button').addEventListener('click', function () { S.ex.splice(i, 1); renderEx(); });
      ul.appendChild(li);
    });
  }
  $('add-ex').addEventListener('click', function () {
    var av = $('ex-a').value, bv = $('ex-b').value;
    if (!av || !bv) return err('err-3', 'Elige a las dos personas para añadir la exclusión.');
    var a = Number(av), b = Number(bv);
    if (a === b) return err('err-3', 'Elige dos personas distintas.');
    if (S.ex.some(function (e) { return (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a); })) return err('err-3', 'Esa exclusión ya está.');
    S.ex.push([a, b]); err('err-3'); renderEx();
    $('ex-a').value = ''; $('ex-b').value = '';
    toast('Exclusión añadida: ' + nameOf(a) + ' y ' + nameOf(b) + ' no se tocarán');
  });
  function idxPairs() {
    var idx = {}; S.people.forEach(function (p, i) { idx[p.id] = i; });
    return S.ex.map(function (e) { return [idx[e[0]], idx[e[1]]]; });
  }
  $('next-3').addEventListener('click', function () {
    if (!API.feasible(S.people.length, idxPairs())) return err('err-3', 'Con esas exclusiones el sorteo no tiene solución. Quita alguna e inténtalo de nuevo.');
    err('err-3'); go(4);
  });

  /* ---------- Paso 4: resumen y creación ---------- */
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
  $('f-orgpin').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 6); });
  $('c-marketing').addEventListener('change', function () { $('contact-field').hidden = !this.checked; });
  $('do-draw').addEventListener('click', function () {
    var btn = this;
    if (!$('c-privacy').checked) return err('err-4', 'Para continuar debes aceptar el aviso de privacidad.');
    var marketing = $('c-marketing').checked, contact = norm($('f-contact').value);
    if (marketing && !contact) return err('err-4', 'Escribe tu WhatsApp o correo, o desmarca la casilla de novedades.');
    var phone = API.normPhone($('f-phone').value), opin = $('f-orgpin').value;
    if (!phone) return err('err-4', 'Escribe tu WhatsApp (por ejemplo 0991234567). Lo necesitas para recuperar tu panel.');
    if (!/^\d{6}$/.test(opin)) return err('err-4', 'Crea un PIN de organizador de exactamente 6 números.');
    if (!API.ready) return err('err-4', 'El servicio de sorteo todavía se está conectando. Vuelve en unos minutos.');
    err('err-4'); btn.disabled = true; btn.textContent = 'Creando tu enlace…';
    API.createDraw({
      group_name: S.g.name, organizer: S.g.organizer, event_date: S.g.date, budget: Number(S.g.budget) || 0, message: S.g.message,
      participants: S.people.map(function (p) { return { name: p.name }; }),
      exclusions: idxPairs(), contact: marketing ? contact : null, marketing: marketing,
      phone: phone, org_pin: opin
    }).then(function (r) {
      S.phone = phone;
      return loadOrganizer(r.organizer_token);
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '🔗 Crear el enlace del sorteo';
      err('err-4', e.code === 'NO_SOLUTION' ? 'No se pudo armar el sorteo con esas exclusiones. Quita alguna e inténtalo otra vez.'
        : e.code === 'NETWORK' ? 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
        : e.code === 'BUSY' ? 'Hay mucha gente usando InSecret ahora mismo. Inténtalo en unos minutos.'
        : e.code === 'BAD_INPUT' ? 'Revisa los datos: nombres sin repetir, fecha de hoy o futura y entre 3 y 50 personas.' : 'No pudimos hacer el sorteo. Inténtalo de nuevo en un momento.');
    });
  });

  /* ---------- Panel del organizador ---------- */
  function loadOrganizer(orgToken) {
    return API.organizerStatus(orgToken).then(function (st) {
      S.orgToken = orgToken; S.st = st; addSaved(orgToken, st.group_name);
      $('res-title').textContent = st.group_name;
      $('res-sub').textContent = 'Organiza ' + st.organizer + ' · ' + fmtDate(st.event_date) + ' · ' + fmtMoney(st.budget);
      var gl = link(st.group_token, 'g');
      $('grp-link').value = gl;
      $('org-link').value = link(orgToken, 'o');
      $('wa-grp').href = 'https://wa.me/?text=' + encodeURIComponent('🎄 ¡Amigo secreto «' + st.group_name + '»!\n' + st.organizer + ' organizó el sorteo. Entra aquí, toca tu nombre, crea tu PIN y descubre a quién le regalas (es un secreto 🤫). Después escribe tu lista de deseos para que tu amigo secreto sepa qué regalarte:\n' + gl + '\n\nHecho con InSecret Poseidón ✨');
      var selfMsg = '🔐 Mi acceso de organizador de «' + st.group_name + '» (InSecret Poseidón). Para volver desde cualquier teléfono: entra a ' + BASE + ' → «¿Ya organizaste un sorteo?» → mi WhatsApp + mi PIN de organizador. Enlace directo: ' + link(orgToken, 'o');
      $('wa-self').href = 'https://wa.me/' + (S.phone || '') + '?text=' + encodeURIComponent(selfMsg);
      renderStatus(st); noindex(); show('results');
      clearInterval(S.poll); S.poll = setInterval(function () { refresh(true); }, 30000);
    });
  }
  function renderStatus(st) {
    var ul = $('status-list'); ul.innerHTML = '';
    st.participants.forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<strong>' + esc(p.name) + '</strong><span class="badge' + (p.opened ? ' ok' : '') + '">' + (p.opened ? 'Ya abrió ✓' : (p.claimed ? 'Eligió su nombre' : 'Sin abrir')) + '</span>' +
        (p.claimed || p.opened ? '<button type="button" class="reset" title="Si alguien eligió un nombre que no era suyo">Reiniciar</button>' : '');
      var rb = li.querySelector('.reset');
      if (rb) rb.addEventListener('click', function () {
        if (!confirm('¿Reiniciar el acceso de ' + p.name + '? Su PIN y su enlace anteriores dejarán de funcionar y podrá volver a elegir su nombre.')) return;
        API.resetParticipant(S.orgToken, p.ref).then(function () { toast('Acceso de ' + p.name + ' reiniciado'); refresh(true); }, function () { toast('No se pudo reiniciar'); });
      });
      ul.appendChild(li);
    });
  }
  function renderLinks(st, people) {
    var ll = $('links-list'); ll.innerHTML = '';
    people.forEach(function (p) {
      var url = link(p.token, 't'), li = document.createElement('li');
      var msg = 'Hola ' + p.name + '! 🎄 ' + st.organizer + ' te invita al amigo secreto «' + st.group_name + '». Descubre a quién le regalas aquí (es solo para ti): ' + url;
      li.innerHTML = '<div class="who"><strong>' + esc(p.name) + '</strong></div>' +
        '<div class="acts"><button type="button" class="btn btn-blue btn-sm" data-c>Copiar enlace</button>' +
        '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">WhatsApp</a></div>';
      li.querySelector('[data-c]').addEventListener('click', function () { copy(url, 'Enlace de ' + p.name + ' copiado'); });
      ll.appendChild(li);
    });
  }
  function refresh(silent) {
    if (!S.orgToken) return;
    API.organizerStatus(S.orgToken).then(function (st) { renderStatus(st); if (!silent) toast('Estado actualizado'); }, function () { if (!silent) toast('No se pudo actualizar'); });
  }
  $('refresh').addEventListener('click', function () { refresh(false); });
  document.querySelector('.indiv').addEventListener('toggle', function () {
    if (!this.open || !S.orgToken) return;
    API.organizerLinks(S.orgToken).then(function (r) { renderLinks(S.st, r.participants); }, function () { toast('No se pudieron cargar los enlaces'); });
  });
  $('copy-grp').addEventListener('click', function () { copy($('grp-link').value, 'Enlace del grupo copiado. ¡Pégalo en tu WhatsApp!'); });
  $('copy-org').addEventListener('click', function () { copy($('org-link').value, 'Enlace de organizador copiado'); });
  $('grp-link').addEventListener('focus', function () { this.select(); });
  $('new-draw').addEventListener('click', function () {
    clearInterval(S.poll);
    location.href = BASE + (API.mode === 'demo' ? '?demo=1' : '');
  });

  /* ---------- Entrada por enlace de grupo ---------- */
  var GP = { token: null, info: null, pick: null };
  function startGroup(gt) {
    GP.token = gt;
    API.groupInfo(gt).then(function (info) {
      GP.info = info; noindex();
      $('gp-title').textContent = info.group_name;
      $('gp-sub').textContent = 'Organiza ' + info.organizer + ' · ' + fmtDate(info.event_date);
      var ul = $('gp-list'); ul.innerHTML = '';
      info.participants.forEach(function (p) {
        var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
        b.innerHTML = esc(p.name) + (p.claimed ? '<small>ya entró · usa tu PIN</small>' : '');
        b.addEventListener('click', function () { pickName(p); });
        li.appendChild(b); ul.appendChild(li);
      });
      $('gp-pick').hidden = false; $('gp-pin').hidden = true; show('group');
    }).catch(function (e) { fail(e.code === 'NOT_FOUND' ? 'Enlace no válido' : 'No pudimos cargarlo',
      e.code === 'NOT_FOUND' ? 'Este enlace no existe o el grupo ya fue borrado después del intercambio.' : 'Revisa tu conexión e inténtalo otra vez.'); });
  }
  function pickName(p) {
    GP.pick = p; err('err-g'); $('gp-pin-input').value = '';
    $('gp-pin-title').textContent = 'Hola, ' + p.name;
    $('gp-pin-help').textContent = p.claimed
      ? 'Escribe el PIN de 4 números que creaste la primera vez.'
      : 'Crea un PIN de 4 números. Solo tú lo sabrás: lo necesitarás si vuelves a entrar desde este enlace. Anótalo o recuérdalo.';
    $('gp-pick').hidden = true; $('gp-pin').hidden = false; $('gp-pin-input').focus();
  }
  $('gp-back').addEventListener('click', function () { $('gp-pin').hidden = true; $('gp-pick').hidden = false; });
  $('gp-pin-input').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
  $('gp-pin-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('gp-go').click(); });
  $('gp-go').addEventListener('click', function () {
    var pin = $('gp-pin-input').value, btn = this;
    if (!/^\d{4}$/.test(pin)) return err('err-g', 'El PIN son exactamente 4 números.');
    err('err-g'); btn.disabled = true;
    API.groupEnter(GP.token, GP.pick.ref, pin).then(function (r) {
      history.replaceState(null, '', link(r.token, 't'));
      if (r.opened) opened = true;
      show('loading'); startReveal(r.token);
    }).catch(function (e) {
      err('err-g', e.code === 'BAD_PIN' ? 'Ese PIN no es el correcto. Inténtalo otra vez.'
        : e.code === 'LOCKED' ? 'Demasiados intentos. Pídele al organizador que reinicie tu acceso.'
        : e.code === 'NETWORK' ? 'Sin conexión. Inténtalo de nuevo.' : 'No pudimos entrar. Inténtalo de nuevo.');
    }).then(function () { btn.disabled = false; });
  });

  /* ---------- Revelación ---------- */
  var REV = null, opened = false;
  function paintReveal(r) {
    REV = r;
    $('rv-friend').textContent = r.receiver;
    $('rv-group').textContent = r.group_name;
    $('rv-date').textContent = fmtDate(r.event_date);
    $('rv-budget').textContent = fmtMoney(r.budget);
    $('rv-wish').textContent = r.wish || ''; $('rv-wish').hidden = !r.wish; $('rv-wish-empty').hidden = !!r.wish;
    if (r.message) { $('rv-msg').textContent = r.message; $('rv-org').textContent = r.organizer; $('rv-msg-wrap').hidden = false; }
  }
  function startReveal(tok) {
    S.tok = tok;
    API.reveal(tok).then(function (r) {
      if (r.was_opened) opened = true;
      $('rv-hello').textContent = 'Hola, ' + r.giver;
      paintReveal(r);
      $('my-wish').value = r.my_wish || ''; $('wish-count').textContent = ($('my-wish').value || '').length;
      noindex(); show('reveal');
      if (opened) { $('stage').hidden = true; $('reveal-card').hidden = false; $('my-wish-card').hidden = false; $('rv-cta').hidden = false; }
    }).catch(function (e) { fail(e.code === 'NOT_FOUND' ? 'Enlace no válido' : 'No pudimos cargarlo',
      e.code === 'NOT_FOUND' ? 'Este enlace no existe, fue reiniciado por el organizador o el grupo ya se borró después del intercambio. Pídele al organizador que te ayude.' : 'Revisa tu conexión e inténtalo otra vez.'); });
  }
  function openGift() {
    var gift = $('gift'); if (gift.classList.contains('open')) return;
    gift.classList.add('open'); $('rv-tap').hidden = true; FX.confetti(); opened = true;
    setTimeout(function () {
      $('stage').classList.add('gone');
      setTimeout(function () {
        $('stage').hidden = true; $('reveal-card').hidden = false; $('my-wish-card').hidden = false; $('rv-cta').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 450);
    }, 1100);
  }
  $('gift').addEventListener('click', openGift);
  $('gift').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGift(); } });
  $('hide-card').addEventListener('click', function () { $('reveal-card').hidden = true; $('reveal-hidden').hidden = false; });
  $('show-card').addEventListener('click', function () { $('reveal-hidden').hidden = true; $('reveal-card').hidden = false; });
  $('rv-refresh').addEventListener('click', function () {
    API.reveal(S.tok).then(function (r) { paintReveal(r); toast(r.wish ? '¡Ya escribió su lista!' : 'Todavía no escribe su lista'); }, function () { toast('No se pudo revisar'); });
  });
  $('my-wish').addEventListener('input', function () { $('wish-count').textContent = this.value.length; });
  $('save-wish').addEventListener('click', function () {
    var b = this; b.disabled = true;
    API.saveWish(S.tok, $('my-wish').value.trim()).then(function () { toast('¡Lista guardada! Tu amigo secreto la verá.'); }, function () { toast('No se pudo guardar. Inténtalo otra vez.'); })
      .then(function () { b.disabled = false; });
  });
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

  /* ---------- Recuperar panel (WhatsApp + PIN) ---------- */
  function renderMine() {
    var l = getSaved(), box = $('mine'), ul = $('mine-list'); ul.innerHTML = '';
    box.hidden = !l.length;
    l.forEach(function (x) {
      var li = document.createElement('li');
      li.innerHTML = '<div class="who"><strong>' + esc(x.n) + '</strong></div><div class="acts"><button type="button" class="btn btn-blue btn-sm">Abrir mi panel</button></div>';
      li.querySelector('button').addEventListener('click', function () { openOrg(x.t); });
      ul.appendChild(li);
    });
  }
  function openOrg(t) {
    show('loading');
    loadOrganizer(t).catch(function () {
      removeSaved(t); show('wizard'); go(1, true); renderMine();
      toast('Ese sorteo ya no existe (se borra después del intercambio).');
    });
  }
  function showRecover() { err('err-rc'); $('rc-form').hidden = false; $('rc-result').hidden = true; $('rc-pin').value = ''; show('recover'); $('rc-phone').focus(); }
  $('open-recover').addEventListener('click', showRecover);
  $('rc-back').addEventListener('click', function () { show('wizard'); });
  $('rc-back2').addEventListener('click', function () { show('wizard'); renderMine(); });
  $('rc-pin').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 6); });
  $('rc-pin').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('rc-go').click(); });
  $('rc-go').addEventListener('click', function () {
    var btn = this, phone = API.normPhone($('rc-phone').value), pin = $('rc-pin').value;
    if (!phone) return err('err-rc', 'Escribe tu WhatsApp tal como lo pusiste (por ejemplo 0991234567).');
    if (!/^\d{6}$/.test(pin)) return err('err-rc', 'El PIN de organizador son 6 números.');
    if (!API.ready) return err('err-rc', 'El servicio todavía se está conectando. Vuelve en unos minutos.');
    err('err-rc'); btn.disabled = true;
    API.orgRecover(phone, pin).then(function (r) {
      S.phone = phone;
      var ul = $('rc-list'); ul.innerHTML = '';
      r.groups.forEach(function (g) {
        addSaved(g.org_token, g.group_name);
        var li = document.createElement('li');
        li.innerHTML = '<div class="who"><strong>' + esc(g.group_name) + '</strong><small>' + esc(fmtDate(g.event_date)) + ' · ' + g.opened + ' de ' + g.total + ' ya abrieron</small></div>' +
          '<div class="acts"><button type="button" class="btn btn-blue btn-sm">Abrir panel</button></div>';
        li.querySelector('button').addEventListener('click', function () { openOrg(g.org_token); });
        ul.appendChild(li);
      });
      $('rc-form').hidden = true; $('rc-result').hidden = false;
    }).catch(function (e) {
      err('err-rc', e.code === 'BAD_PIN' ? 'No encontramos un sorteo con ese WhatsApp y ese PIN. Revisa los datos (el sorteo se borra después de la fecha del intercambio).'
        : e.code === 'LOCKED' ? 'Demasiados intentos. Vuelve a intentar en ' + (e.minutes || 15) + ' minutos.'
        : e.code === 'NETWORK' ? 'Sin conexión. Inténtalo de nuevo.' : 'No pudimos revisar. Inténtalo de nuevo.');
    }).then(function () { btn.disabled = false; });
  });

  function boot() {
    FX.snow();
    if (API.mode === 'demo') $('demo-banner').hidden = false;
    renderPeople();
    var t = qs.get('t'), g = qs.get('g'), o = qs.get('o');
    if ((t || g) && !API.ready) return fail('Casi listo', 'InSecret se está conectando. Vuelve a abrir tu enlace en unos minutos.');
    if (t) return startReveal(t);
    if (g) return startGroup(g);
    if (o && API.ready) {
      return loadOrganizer(o).catch(function () {
        removeSaved(o);
        fail('Enlace de organizador no válido', 'No encontramos ese grupo. Puede que ya se haya borrado después del intercambio.');
      });
    }
    renderMine();
    show('wizard'); go(1, true); window.scrollTo({ top: 0 });
  }
  boot();
})();
