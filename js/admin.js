/* Administración de invitaciones · Poseidón (privado: la clave se valida en el servidor) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = window.INSECRET_CONFIG || {}, DEF = window.INV_DEF || {};
  var KEY = '', CUR = null, LAST = null, LOGO = '', ITEMS = [], CRES = [];
  var ORIGIN = location.origin;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2200); }
  function view(v) { ['login', 'list', 'form', 'done', 'comp'].forEach(function (n) { $('v-' + n).hidden = n !== v; }); $('logout').hidden = v === 'login'; window.scrollTo({ top: 0 }); }
  function rpc(fn, body) {
    return fetch(C.supabaseUrl + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }); }, function () { return { error: 'NETWORK' }; });
  }
  var ERR = {
    BAD_KEY: 'Clave incorrecta.', LOCKED: 'Demasiados intentos. Espera 15 minutos e inténtalo otra vez.', NETWORK: 'Sin conexión. Revisa tu internet.',
    ADMIN_NOT_SET: 'Todavía no se creó la clave de administrador. Créala una sola vez en el editor SQL de Supabase (ver instrucciones en el chat).',
    SLUG_TAKEN: 'Ese nombre de enlace ya existe. Escribe otro.', BAD_DATE: 'Revisa la fecha y hora del evento.', TOO_BIG: 'La invitación pesa demasiado (probablemente el logo). Usa un logo más pequeño.',
    BAD_INPUT: 'Revisa los datos: falta el nombre del cliente o la ocasión.', NOT_FOUND: 'No se encontró esa invitación.'
  };
  function msg(r) { return ERR[r && r.error] || (r && r.message) || 'No se pudo completar. Inténtalo otra vez.'; }
  function phoneWa(p) { var d = String(p || '').replace(/\D/g, ''); if (/^09\d{8}$/.test(d)) d = '593' + d.slice(1); return d; }
  function slugify(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function fmtDT(iso) { try { return new Date(iso).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }
  var THEMES = { navidad: 'Cena navideña', fin: 'Fin de año', boda: 'Boda o aniversario', cumple: 'Cumpleaños', cita: 'Cita romántica' };

  /* ---------- acceso ---------- */
  function login() {
    var k = $('key').value; if (!k) return;
    $('go').disabled = true; $('e-login').hidden = true;
    rpc('admin_list', { p_key: k }).then(function (r) {
      $('go').disabled = false;
      if (r.error || r.message) { $('e-login').textContent = msg(r); $('e-login').hidden = false; return; }
      KEY = k; try { sessionStorage.setItem('inv_admin_k', k); } catch (e) {} showList(r.items);
    });
  }
  $('go').addEventListener('click', login);
  $('key').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
  $('logout').addEventListener('click', function () { KEY = ''; try { sessionStorage.removeItem('inv_admin_k'); } catch (e) {} $('key').value = ''; view('login'); });

  /* ---------- lista ---------- */
  function loadList() { return rpc('admin_list', { p_key: KEY }).then(function (r) { if (r.error) { toast(msg(r)); if (r.error === 'BAD_KEY') view('login'); return; } showList(r.items); }); }
  function showList(items) {
    ITEMS = items; view('list'); var box = $('items'); box.innerHTML = ''; $('list-empty').hidden = !!items.length;
    items.forEach(function (i) {
      var d = document.createElement('div'); d.className = 'it';
      d.innerHTML = '<h3>' + esc(i.client_name) + ' <span class="pill' + (i.active ? '' : ' off') + '">' + (i.active ? 'Activa' : 'Desactivada') + '</span></h3>' +
        '<div class="meta"><span>' + esc(THEMES[i.theme] || i.theme) + ' · ' + esc(i.title || '') + '</span><span>' + esc(fmtDT(i.event_at)) + '</span><span>' + (i.answers || 0) + ' respuestas</span>' + (i.notes ? '<span>📝 ' + esc(i.notes) + '</span>' : '') + '</div>' +
        '<div class="btns"><button class="btn gold" data-a="edit">Editar</button><a class="btn ghost" target="_blank" rel="noopener" href="' + ORIGIN + '/invitacion/?i=' + esc(i.slug) + '">Ver</a>' +
        '<a class="btn ghost" target="_blank" rel="noopener" href="' + ORIGIN + '/anfitrion/?h=' + esc(i.host_token) + '">Panel del anfitrión</a><button class="btn ghost" data-a="msg">Mensaje para el cliente</button><button class="btn danger" data-a="del">Eliminar</button></div>';
      d.querySelector('[data-a=edit]').addEventListener('click', function () { rpc('admin_get', { p_key: KEY, p_id: i.id }).then(function (r) { if (r.error) return toast(msg(r)); openForm(r); }); });
      d.querySelector('[data-a=msg]').addEventListener('click', function () { var m = clientMsg(i.client_name, i.title, i.slug, i.host_token); copy(m, 'Mensaje copiado'); });
      d.querySelector('[data-a=del]').addEventListener('click', function () {
        if (!confirm('¿Eliminar la invitación de «' + i.client_name + '» y todas sus confirmaciones? No se puede deshacer.')) return;
        rpc('admin_delete', { p_key: KEY, p_id: i.id }).then(function (r) { if (r.error) return toast(msg(r)); toast('Eliminada'); loadList(); });
      });
      box.appendChild(d);
    });
  }
  $('new').addEventListener('click', function () { openForm(null); });
  $('back').addEventListener('click', loadList);
  $('d-list').addEventListener('click', loadList);

  /* ---------- formulario ---------- */
  function rowIt(t, x, box) { var d = document.createElement('div'); d.className = 'rw'; d.innerHTML = '<input type="time" value="' + esc(t || '') + '" aria-label="Hora"><input maxlength="80" value="' + esc(x || '') + '" placeholder="Qué pasa" aria-label="Momento"><button type="button" class="x" aria-label="Quitar">✕</button>'; d.querySelector('.x').onclick = function () { d.remove(); }; (box || $('it-rows')).appendChild(d); }
  function rowMe(a, b, box) { var d = document.createElement('div'); d.className = 'rw two'; d.innerHTML = '<input maxlength="30" value="' + esc(a || '') + '" placeholder="Entrada" aria-label="Tipo"><input maxlength="90" value="' + esc(b || '') + '" placeholder="Plato" aria-label="Plato"><button type="button" class="x" aria-label="Quitar">✕</button>'; d.querySelector('.x').onclick = function () { d.remove(); }; (box || $('me-rows')).appendChild(d); }
  $('it-add').onclick = function () { rowIt('', ''); };
  $('me-add').onclick = function () { rowMe('', ''); };

  function fillText(k) {
    var d = DEF[k] || {};
    $('lead').value = d.lead || ''; $('to').value = d.to || ''; $('host').value = d.host || ''; $('title').value = d.title || ''; $('msg').value = d.msg || '';
    $('date').value = d.date || ''; $('target').value = d.target || ''; $('place').value = d.place || ''; $('mapq').value = d.mapq || ''; $('maplink').value = ''; $('allow-g').checked = true; $('corp').checked = false;
    $('it-rows').innerHTML = ''; (d.it || []).forEach(function (r) { rowIt(r[0], r[1]); });
    $('me-rows').innerHTML = ''; (d.menu || []).forEach(function (r) { rowMe(r[0], r[1]); });
    $('dress').value = (d.dress && d.dress[0]) || ''; var cs = (d.dress && d.dress[1]) || []; $('c1').value = cs[0] || '#888888'; $('c2').value = cs[1] || '#aaaaaa'; $('c3').value = cs[2] || '#cccccc';
    $('x-t').value = (d.extra && d.extra[1]) || ''; $('x-x').value = (d.extra && d.extra[2]) || '';
    var rs = d.rsvp || []; $('r-q').value = rs[0] || '¿Nos acompañas?'; $('r-y').value = rs[1] || 'Sí, voy'; $('r-n').value = rs[2] || 'No puedo';
  }
  function setLogo(url) { LOGO = url || ''; $('logo-prev').hidden = !LOGO; if (LOGO) $('logo-img').src = LOGO; }
  function openForm(rec) {
    CUR = rec ? rec.id : null; $('e-form').hidden = true; $('f-h').textContent = rec ? 'Editar invitación' : 'Nueva invitación';
    $('form').reset(); setLogo('');
    var theme = rec ? rec.theme : 'navidad'; $('theme').value = theme;
    $('client').value = rec ? rec.client_name : ''; $('contact').value = rec ? (rec.client_contact || '') : ''; $('notes').value = rec ? (rec.notes || '') : ''; $('active').checked = rec ? !!rec.active : true; $('slug').value = rec ? rec.slug : '';
    if (rec) {
      var c = rec.config || {}; $('lead').value = c.lead || ''; $('to').value = c.to || ''; $('host').value = c.host || ''; $('title').value = c.title || ''; $('msg').value = c.msg || '';
      $('date').value = c.date || ''; $('target').value = c.target || ''; $('place').value = c.place || ''; $('mapq').value = c.mapq || ''; $('maplink').value = c.maplink || ''; $('allow-g').checked = !c.noguests; $('corp').checked = !!c.corp;
      $('it-rows').innerHTML = ''; (c.it || []).forEach(function (r) { rowIt(r[0], r[1]); }); $('me-rows').innerHTML = ''; (c.menu || []).forEach(function (r) { rowMe(r[0], r[1]); });
      $('dress').value = (c.dress && c.dress[0]) || ''; var cs = (c.dress && c.dress[1]) || []; $('c1').value = cs[0] || '#888888'; $('c2').value = cs[1] || '#aaaaaa'; $('c3').value = cs[2] || '#cccccc';
      $('x-t').value = (c.extra && c.extra[1]) || ''; $('x-x').value = (c.extra && c.extra[2]) || '';
      var rs = c.rsvp || []; $('r-q').value = rs[0] || ''; $('r-y').value = rs[1] || ''; $('r-n').value = rs[2] || '';
      var b = c.brand || {}; setLogo(b.logo); $('use-accent').checked = !!b.accent; if (b.accent) $('accent').value = b.accent; $('sign').value = b.sign || '';
    } else { fillText(theme); }
    view('form');
  }
  $('theme').addEventListener('change', function () { if (!CUR && confirm('¿Cargar los textos de ejemplo de esta ocasión? Se reemplazan los textos de abajo.')) fillText(this.value); });
  $('load-def').addEventListener('click', function () { if (confirm('Se reemplazan los textos de abajo por el ejemplo de esta ocasión. ¿Continuar?')) fillText($('theme').value); });

  /* logo: se reduce y se guarda dentro de la invitación */
  function readLogo(f, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(1, 320 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        var url = cv.toDataURL('image/webp', .85); if (url.indexOf('data:image/webp') !== 0) url = cv.toDataURL('image/png');
        if (url.length > 140000) return toast('El logo es muy pesado. Prueba con otro archivo más simple.');
        cb(url);
      };
      im.onerror = function () { toast('No se pudo leer esa imagen.'); };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  $('logo').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) readLogo(f, setLogo); });
  $('logo-del').addEventListener('click', function () { setLogo(''); $('logo').value = ''; });

  function collect() {
    var it = [].map.call($('it-rows').children, function (r) { var i = r.querySelectorAll('input'); return [i[0].value.trim(), i[1].value.trim()]; }).filter(function (r) { return r[1]; });
    var me = [].map.call($('me-rows').children, function (r) { var i = r.querySelectorAll('input'); return [i[0].value.trim(), i[1].value.trim()]; }).filter(function (r) { return r[1]; });
    var cfg = {
      lead: $('lead').value.trim(), to: $('to').value.trim(), host: $('host').value.trim(), title: $('title').value.trim(), msg: $('msg').value.trim(),
      date: $('date').value, place: $('place').value.trim(), mapq: $('mapq').value.trim(), maplink: $('maplink').value.trim(), noguests: !$('allow-g').checked, corp: $('corp').checked, it: it, menu: me,
      dress: [$('dress').value.trim(), [$('c1').value, $('c2').value, $('c3').value]], extra: ['gi', $('x-t').value.trim(), $('x-x').value.trim()],
      rsvp: [$('r-q').value.trim() || '¿Nos acompañas?', $('r-y').value.trim() || 'Sí, voy', $('r-n').value.trim() || 'No puedo']
    };
    if ($('target').value) cfg.target = $('target').value;
    var brand = {}; if (LOGO) brand.logo = LOGO; if ($('use-accent').checked) brand.accent = $('accent').value; if ($('sign').value.trim()) brand.sign = $('sign').value.trim();
    if (Object.keys(brand).length) cfg.brand = brand;
    return cfg;
  }
  function formErr(t) { $('e-form').textContent = t; $('e-form').hidden = false; $('e-form').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  $('form').addEventListener('submit', function (e) {
    e.preventDefault(); $('e-form').hidden = true;
    var cfg = collect();
    if (!$('client').value.trim()) return formErr('Escribe el nombre del cliente.');
    if (!cfg.title) return formErr('Escribe el título grande de la invitación.');
    if (!cfg.date) return formErr('Elige la fecha y hora del evento.');
    var slug = $('slug').value.trim() || slugify($('client').value) + '-' + $('theme').value;
    var btn = $('save'); btn.disabled = true; btn.textContent = 'Guardando…';
    rpc('admin_save', { p_key: KEY, p_id: CUR, p_slug: slug, p_theme: $('theme').value, p_client: $('client').value, p_contact: $('contact').value, p_notes: $('notes').value, p_config: cfg, p_active: $('active').checked }).then(function (r) {
      btn.disabled = false; btn.textContent = 'Guardar invitación';
      if (r.error || r.message) return formErr(msg(r));
      LAST = { id: r.id, slug: r.slug, host: r.host_token, client: $('client').value.trim(), title: cfg.title, contact: $('contact').value };
      CUR = r.id; $('slug').value = r.slug; showDone();
    });
  });

  /* ---------- paquete empresa ---------- */
  var CERR = { BAD_KEY: 'Clave incorrecta.', LOCKED: ERR.LOCKED, NO_BREVO_KEY: 'Falta guardar BREVO_API_KEY en los secretos de Supabase.', BAD_COUNT: 'Se necesitan entre 3 y 100 personas para el amigo secreto (1 a 100 si es solo invitación).', BAD_EMAIL: 'Revisa el correo de ', DUP_NAME: 'Hay un nombre repetido: ', BAD_NAME: 'Un nombre es muy largo o está vacío.', BREVO_KEY_FORMAT: 'La clave guardada en Supabase no es una clave API de Brevo (debe empezar con xkeysib-). Revisa que copiaste la de la pestaña «Claves API», no la de SMTP.', BAD_INPUT: 'Revisa la fecha del intercambio (no puede ser pasada) y el nombre de la empresa.', INVITE_NOT_FOUND: 'No se encontró esa invitación.', NO_SOLUTION: 'No se pudo hacer el sorteo con esos datos.' };
  function parseList() {
    return $('c-list').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var m = l.match(/^(.*?)[\t,;]\s*([^\s,;\t]+@[^\s,;\t]+)\s*$/) || l.match(/^(.*?)\s+([^\s]+@[^\s]+)$/); return m ? { name: m[1].trim(), email: m[2].trim() } : { name: l, email: '' };
    });
  }
  $('c-list').addEventListener('input', function () { var n = parseList().length; $('c-count').textContent = n + (n === 1 ? ' persona' : ' personas'); });
  $('c-ss').addEventListener('change', function () { $('c-ssbox').hidden = !this.checked; });
  $('new-comp').addEventListener('click', function () {
    CINV = null; setCLogo(''); $('c-it-rows').innerHTML = ''; $('c-me-rows').innerHTML = ''; $('c-dress').value = ''; $('c-x-t').value = ''; $('c-x-x').value = ''; $('c-occ').value = 'navidad'; fillOcc(); $('c-res').hidden = true; $('c-err').hidden = true; view('comp');
  });
  $('comp-back').addEventListener('click', loadList);
  function cerr(t) { $('c-err').textContent = t; $('c-err').hidden = false; $('c-err').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  var CLOGO = '', CINV = null;
  function setCLogo(u) { CLOGO = u || ''; $('c-logo-prev').hidden = !CLOGO; if (CLOGO) $('c-logo-img').src = CLOGO; }
  $('c-logo').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) readLogo(f, setCLogo); });
  $('c-logo-del').addEventListener('click', function () { setCLogo(''); $('c-logo').value = ''; });
  function exDate() { return ($('c-same').checked && $('c-occ').value && $('c-when').value) ? $('c-when').value.slice(0, 10) : $('c-date').value; }
  function syncSame() { var can = !!$('c-occ').value; $('c-same-w').hidden = !can; $('c-date-w').hidden = can && $('c-same').checked; }
  $('c-same').addEventListener('change', syncSame);
  $('c-it-add').onclick = function () { rowIt('', '', $('c-it-rows')); };
  $('c-me-add').onclick = function () { rowMe('', '', $('c-me-rows')); };
  $('c-ex').onclick = function () { var d = DEF[$('c-occ').value] || {}; $('c-it-rows').innerHTML = ''; (d.it || []).forEach(function (r) { rowIt(r[0], r[1], $('c-it-rows')); }); $('c-me-rows').innerHTML = ''; (d.menu || []).forEach(function (r) { rowMe(r[0], r[1], $('c-me-rows')); }); $('c-dress').value = (d.dress && d.dress[0]) || ''; var cs = (d.dress && d.dress[1]) || []; if (cs[0]) { $('c-c1').value = cs[0]; $('c-c2').value = cs[1]; $('c-c3').value = cs[2]; } if (!$('c-ss').checked) { $('c-x-t').value = (d.extra && d.extra[1]) || ''; $('c-x-x').value = (d.extra && d.extra[2]) || ''; } };
  function fillOcc() { var k = $('c-occ').value; $('c-invbox').hidden = !k; syncSame(); if (k) { var d = DEF[k] || {}; $('c-title').value = d.title || ''; $('c-place').value = ''; $('c-imsg').value = d.msg || ''; } }
  $('c-occ').addEventListener('change', fillOcc);
  function rows(box) { return [].map.call(box.children, function (r) { var i = r.querySelectorAll('input'); return [i[0].value.trim(), i[1].value.trim()]; }).filter(function (r) { return r[1]; }); }
  function ensureInvite() {
    var k = $('c-occ').value; if (!k) return Promise.resolve({ slug: '' });
    var d = DEF[k] || {}, cfg = JSON.parse(JSON.stringify(d));
    cfg.title = $('c-title').value.trim(); cfg.date = $('c-when').value; cfg.place = $('c-place').value.trim(); cfg.msg = $('c-imsg').value.trim(); cfg.host = $('c-co').value.trim(); cfg.mapq = $('c-city').value.trim(); cfg.maplink = $('c-maplink').value.trim(); cfg.noguests = true; cfg.corp = $('c-corp').checked; cfg.to = 'Para el equipo de ' + $('c-co').value.trim(); cfg.lead = 'Estás cordialmente invitado'; cfg.it = rows($('c-it-rows')); cfg.menu = rows($('c-me-rows')); cfg.dress = [$('c-dress').value.trim(), [$('c-c1').value, $('c-c2').value, $('c-c3').value]]; cfg.extra = ['gi', $('c-x-t').value.trim(), $('c-x-x').value.trim()]; if ($('c-ss').checked && /^amigo secreto$/i.test(cfg.extra[1])) cfg.extra = ['gi', '', ''];
    delete cfg.target; var br = { accent: $('c-accent').value }; if (CLOGO) br.logo = CLOGO; if ($('c-sign').value.trim()) br.sign = $('c-sign').value.trim(); cfg.brand = br;
    var slug = CINV ? CINV.slug : slugify($('c-co').value) + '-' + k;
    return rpc('admin_save', { p_key: KEY, p_id: CINV ? CINV.id : null, p_slug: slug, p_theme: k, p_client: $('c-co').value.trim(), p_contact: '', p_notes: 'Paquete Empresa', p_config: cfg, p_active: true }).then(function (r) { if (r.error || r.message) { cerr(msg(r)); return null; } CINV = { id: r.id, slug: r.slug, host: r.host_token }; return CINV; });
  }
  function fmtWhen() { try { return new Date($('c-when').value + ':00-05:00').toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'full', timeStyle: 'short' }); } catch (e) { return ''; } }
  function previewHtml(name) {
    var ac = $('c-accent').value, inv = !!$('c-occ').value, ss = $('c-ss').checked, sign = $('c-sign').value.trim(), intro = $('c-intro').value.trim(), gold = '#e3c27a';
    var nice = function (n) { n = n.replace(/\s+/g, ' ').trim(); return n === n.toUpperCase() || n === n.toLowerCase() ? n.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }) : n; };
    var first = esc(nice(name).split(' ')[0]), banner = '../assets/mail/' + (['navidad', 'fin', 'boda', 'cumple', 'cita'].indexOf($('c-occ').value) >= 0 ? $('c-occ').value : 'navidad') + '-v2.jpg';
    var btn = function (l, solid) { return '<span style="display:block;text-align:center;font:700 16px Arial,sans-serif;padding:15px 18px;border-radius:999px;margin:12px 0;' + (solid ? 'background:' + gold + ';color:#1a1405;' : 'border:2px solid ' + gold + ';color:' + gold + ';') + '">' + l + '</span>'; };
    var text = intro ? esc(intro).replace(/\n/g, '<br>') : (inv ? 'Te invitamos a <b style="color:#fff">' + esc($('c-title').value) + '</b>' + (fmtWhen() ? '<br><span style="color:' + gold + '">' + esc(fmtWhen()) + '</span>' : '') + '.' : '') + (ss ? '<br>' + (inv ? 'Además, este año hay' : 'Este año hay') + ' <b style="color:#fff">amigo secreto</b>.' : '');
    return '<div style="max-width:480px;margin:0 auto;background:#0b1220;color:#f6f1e4;border-radius:16px;overflow:hidden;font-family:Arial,sans-serif;border:1px solid rgba(227,194,122,.35)"><img src="' + banner + '" alt="" style="display:block;width:100%;height:auto"><div style="height:6px;background:' + ac + '"></div><div style="padding:28px 26px 24px">' +
      '<div style="font:700 12px Arial;letter-spacing:.3em;text-transform:uppercase;color:' + gold + ';text-align:center">' + esc($('c-co').value || 'Tu empresa') + '</div><h2 style="margin:14px 0 12px;font:700 26px Georgia,serif;text-align:center;color:#f3dfae">Hola, ' + first + '</h2><p style="line-height:1.7;font-size:16px;margin:0 0 14px;text-align:center;color:#e9e4d6">' + text + '</p>' +
      (inv ? btn('Ver mi invitación y confirmar', true) : '') + (ss ? btn('🎁 Descubrir mi amigo secreto', !inv) : '') +
      '<p style="font-size:12px;color:#8f99ab;margin:12px 0 0;text-align:center">' + (ss ? 'El enlace del amigo secreto es solo tuyo. No lo compartas.' : '') + '</p>' +
      (sign ? '<p style="border-top:1px solid rgba(227,194,122,.25);margin-top:20px;padding-top:14px;font:italic 15px Georgia,serif;color:' + gold + ';text-align:center">' + esc(sign).replace(/\n/g, '<br>') + '</p>' : '') + '</div><div style="padding:12px;background:#080d18;text-align:center;font:12px Arial;color:#7f8aa0">Hecho por Poseidón</div></div>';
  }
  $('c-prev-btn').addEventListener('click', function () {
    var ps = parseList(), nm = (ps[0] && ps[0].name) || 'Laura', first = nm.split(' ')[0];
    $('c-prev-sub').textContent = 'Asunto: ' + first + ', ' + ($('c-occ').value ? 'te invitamos a ' + ($('c-title').value || 'nuestro evento') : 'tu amigo secreto está listo') + ' · De: ' + ($('c-co').value || 'Tu empresa') + ' · Poseidón';
    $('c-prev-mail').innerHTML = previewHtml(nm); $('c-prev').hidden = false; $('c-prev').scrollIntoView({ behavior: 'smooth' });
  });
  function sendComp(people, resend) {
    var btn = $('c-send'); btn.disabled = true; btn.textContent = 'Enviando…'; $('c-err').hidden = true;
    return ensureInvite().then(function (inv) { if (!inv) { btn.disabled = false; btn.textContent = 'Enviar correos'; return; } return doSend(people, resend, inv, btn); });
  }
  function doSend(people, resend, inv, btn) {
    var body = { key: KEY, company: $('c-co').value.trim(), slug: inv.slug, withSecret: $('c-ss').checked, eventDate: exDate(), budget: $('c-budget').value, message: $('c-msg').value, accent: $('c-accent').value, sign: $('c-sign').value, intro: $('c-intro').value, organizer: $('c-co').value.trim(), people: people };
    return fetch(C.supabaseUrl + '/functions/v1/send-company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { error: 'NETWORK' }; }); }, function () { return { error: 'NETWORK' }; })
      .then(function (r) {
        btn.disabled = false; btn.textContent = 'Enviar correos';
        if (!r.ok) { var m = CERR[r.error] || ERR[r.error] || 'No se pudo enviar. Inténtalo otra vez.'; if (r.error === 'BAD_EMAIL' || r.error === 'DUP_NAME') m += (r.who || r.detail || ''); return cerr(m); }
        var keep = resend ? CRES.filter(function (x) { return x.ok; }) : []; CRES = keep.concat(r.results); r.sent += keep.length; r.failed = CRES.filter(function (x) { return !x.ok; }).length; r.results = CRES; var box = $('c-rows'); box.innerHTML = '';
        r.results.forEach(function (x) { var d = document.createElement('div'); d.className = 'rw'; d.style.gridTemplateColumns = '1fr auto'; d.innerHTML = '<span>' + esc(x.name) + ' <small class="muted">' + esc(x.email) + '</small>' + (x.ok ? '' : '<br><small class="muted">' + esc(x.error || '') + '</small>') + '</span><span class="pill' + (x.ok ? '' : ' off') + '">' + (x.ok ? 'Enviado' : 'Falló') + '</span>'; box.appendChild(d); });
        $('c-res-extra').innerHTML = inv.slug ? 'Invitación: <b>' + esc(location.origin + '/invitacion/?i=' + inv.slug) + '</b><br>Panel privado para Recursos Humanos: <b>' + esc(location.origin + '/anfitrion/?h=' + inv.host) + '</b>' : ''; $('c-res-h').textContent = r.sent + ' enviados' + (r.failed ? ' · ' + r.failed + ' fallaron' : ''); $('c-retry').hidden = !r.failed; $('c-res').hidden = false; $('c-res').scrollIntoView({ behavior: 'smooth' });
      });
  }
  $('c-send').addEventListener('click', function () {
    var ps = parseList(); if (!$('c-co').value.trim()) return cerr('Escribe el nombre de la empresa.');
    if (!ps.length) return cerr('Pega la lista de colaboradores.');
    var bad = ps.filter(function (p) { return !p.name || !p.email; }); if (bad.length) return cerr('Revisa esta línea: ' + (bad[0].name || '(vacía)') + ' — falta el correo o el nombre.');
    if ($('c-ss').checked && ps.length < 3) return cerr('El amigo secreto necesita al menos 3 personas.');
    if ($('c-ss').checked && !exDate()) return cerr('Elige la fecha del intercambio.');
    if (!$('c-ss').checked && !$('c-occ').value) return cerr('Elige un tipo de invitación o activa el amigo secreto.');
    if ($('c-occ').value && (!$('c-title').value.trim() || !$('c-when').value)) return cerr('Escribe el título y la fecha y hora del evento.');
    if (!confirm('Se enviarán ' + ps.length + ' correos' + ($('c-ss').checked ? ' y se hará el sorteo (no se puede repetir)' : '') + '. ¿Continuar?')) return;
    sendComp(ps);
  });
  $('c-retry').addEventListener('click', function () {
    var f = CRES.filter(function (x) { return !x.ok; }).map(function (x) { return { name: x.name, email: x.email, token: x.token }; });
    if (f.length) sendComp(f, true);
  });

  /* abrir el calendario al tocar los campos de fecha */
  document.addEventListener('click', function (e) { var i = e.target; if (i && i.tagName === 'INPUT' && /^(date|datetime-local|time)$/.test(i.type) && i.showPicker) { try { i.showPicker(); } catch (x) {} } });

  /* ---------- resultado ---------- */
  function clientMsg(client, title, slug, host) {
    var inv = ORIGIN + '/invitacion/?i=' + slug, hp = ORIGIN + '/anfitrion/?h=' + host;
    return 'Hola ' + client + ' 👋 ¡Tu invitación «' + title + '» ya está lista!\n\n' +
      '💌 Enlace para compartir con tus invitados:\n' + inv + '\n\n' +
      '📋 Tu panel privado (aquí ves quién confirmó, con cuántas personas y sus notas; no lo compartas):\n' + hp + '\n\n' +
      'En tu panel también puedes generar un enlace personalizado para cada invitado. Cualquier cambio me avisas. ¡Gracias por confiar en Poseidón!';
  }
  function showDone() {
    $('d-inv').value = ORIGIN + '/invitacion/?i=' + LAST.slug; $('d-host').value = ORIGIN + '/anfitrion/?h=' + LAST.host;
    var m = clientMsg(LAST.client, LAST.title, LAST.slug, LAST.host); $('d-msg').value = m;
    var n = phoneWa(LAST.contact); $('d-wa').href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(m); $('d-wa').hidden = !n;
    $('d-view').href = $('d-inv').value; view('done');
  }
  $('d-edit').addEventListener('click', function () { view('form'); });
  function copy(t, m) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(m || 'Copiado'); }, function () { toast('No se pudo copiar. Selecciónalo y cópialo a mano.'); }); }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-cp]'); if (b) copy($(b.dataset.cp).value, 'Copiado'); });

  /* entrada automática si ya había sesión en esta pestaña */
  try { var k0 = sessionStorage.getItem('inv_admin_k'); if (k0) { $('key').value = k0; login(); } } catch (e) {}
})();
