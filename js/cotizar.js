/* Calculadora de empresas + proforma como imagen (todo en el navegador) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var WA = '593968520688', KIND = 'combo';
  var P = { inv: 49, ami: 39, combo: 79, extra: 1.5, base: 25, cotizar: 100 };
  var NAMES = { inv: 'Invitación interactiva empresarial', ami: 'Amigo secreto por correo', combo: 'Combo: invitación + amigo secreto' };
  function money(v) { return '$' + v.toFixed(2).replace('.', ','); }
  function calc() {
    var n = Math.max(1, Math.min(500, parseInt($('n').value, 10) || 0)), rows = [], tot = 0, quote = n >= P.cotizar;
    var base = P[KIND]; rows.push([NAMES[KIND] + ' (hasta ' + P.base + ' personas)', base]); tot += base;
    if (KIND !== 'ami' && n > P.base) { var x = (n - P.base) * P.extra; rows.push([(n - P.base) + ' persona' + (n - P.base > 1 ? 's' : '') + ' adicional' + (n - P.base > 1 ? 'es' : '') + ' × ' + money(P.extra), x]); tot += x; }
    var iva = Math.round(tot * 15) / 100; return { n: n, rows: rows, sub: tot, iva: iva, tot: Math.round((tot + iva) * 100) / 100, quote: quote };
  }
  function render() {
    var c = calc(); $('q-rows').innerHTML = '';
    c.rows.forEach(function (r) { var li = document.createElement('li'); li.textContent = r[0] + ' · ' + money(r[1]); $('q-rows').appendChild(li); });
    if (!c.quote) { [['Subtotal', c.sub], ['IVA 15%', c.iva]].forEach(function (r) { var li = document.createElement('li'); li.textContent = r[0] + ' · ' + money(r[1]); li.style.opacity = '.8'; $('q-rows').appendChild(li); }); }
    $('q-tot').textContent = c.quote ? 'A medida' : money(c.tot);
    $('q-note').textContent = c.quote ? 'Desde 100 personas armamos una cotización a tu medida. Habla con un asesor.' : 'Valores más IVA (15%). Incluye hasta 5 ediciones, panel de confirmaciones y enlace individual por invitado.';
    $('make').hidden = c.quote; $('n-help').textContent = KIND === 'ami' ? 'El amigo secreto tiene un valor fijo hasta 99 personas.' : 'Hasta ' + P.base + ' personas el valor base ya está incluido; cada persona adicional suma ' + money(P.extra) + '.';
    $('wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Afrodita 👋 quiero ' + (c.quote ? 'cotizar a medida' : 'contratar') + ': ' + NAMES[KIND] + ' para ' + c.n + ' personas' + (c.quote ? '.' : ' (' + money(c.tot) + ').'));
    return c;
  }
  $('kind').addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (!b) return; KIND = b.dataset.k; [].forEach.call($('kind').children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); render(); });
  $('n').addEventListener('input', render);
  function err(m) { $('e').textContent = m; $('e').hidden = !m; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function wrap(ctx, t, x, y, w, lh) { var words = String(t).split(' '), line = '', yy = y; words.forEach(function (wd) { var test = line ? line + ' ' + wd : wd; if (ctx.measureText(test).width > w && line) { ctx.fillText(line, x, yy); line = wd; yy += lh; } else line = test; }); ctx.fillText(line, x, yy); return yy; }
  function draw(c, d) {
    var W = 1080, rowsH = c.rows.length * 74, H = 1215 + rowsH, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d');
    var bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#06142a'); bg.addColorStop(1, '#040a14'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,158,231,.10)'; g.beginPath(); g.arc(W, 0, 420, 0, 7); g.fill();
    g.fillStyle = '#ffd600'; g.fillRect(0, 0, W, 10);
    var ok = function () {
      g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.font = '600 54px "Playfair Display", serif'; g.fillText('Proforma', 70, 150);
      g.font = '500 28px Outfit, sans-serif'; g.fillStyle = '#7fd4ff'; g.fillText('Nº ' + d.num, 70, 196); g.fillStyle = '#9fb3c8'; g.fillText('Fecha ' + d.date + '  ·  Válida por 15 días', 70, 238);
      g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '700 34px Outfit, sans-serif'; g.fillText('Poseidón', W - 70, 138); g.fillStyle = '#9fb3c8'; g.font = '400 24px Outfit, sans-serif'; g.fillText('poseidonmk.com', W - 70, 176); g.fillText('InSecret · invitaciones y amigo secreto', W - 70, 210); g.textAlign = 'left';
      rr(g, 70, 280, W - 140, 190, 24); g.fillStyle = 'rgba(255,255,255,.06)'; g.fill();
      g.fillStyle = '#7fd4ff'; g.font = '600 22px Outfit, sans-serif'; g.fillText('PARA', 100, 326); g.fillStyle = '#fff'; g.font = '600 36px Outfit, sans-serif'; g.fillText(d.co, 100, 374);
      g.fillStyle = '#c9d6e4'; g.font = '400 26px Outfit, sans-serif'; g.fillText(d.name + '  ·  ' + d.tel, 100, 416); if (d.ruc || d.mail) g.fillText([d.ruc && 'RUC ' + d.ruc, d.mail].filter(Boolean).join('  ·  '), 100, 452);
      var y = 540; g.fillStyle = '#7fd4ff'; g.font = '600 22px Outfit, sans-serif'; g.fillText('DETALLE', 70, y); g.textAlign = 'right'; g.fillText('VALOR', W - 70, y); g.textAlign = 'left'; y += 20;
      c.rows.forEach(function (r) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(70, y + 14); g.lineTo(W - 70, y + 14); g.stroke(); g.fillStyle = '#fff'; g.font = '400 28px Outfit, sans-serif'; wrap(g, r[0], 70, y + 56, W - 360, 34); g.textAlign = 'right'; g.font = '600 30px Outfit, sans-serif'; g.fillText(money(r[1]), W - 70, y + 56); g.textAlign = 'left'; y += 74; });
      y += 30; g.fillStyle = '#c9d6e4'; g.font = '400 28px Outfit, sans-serif'; g.fillText('Subtotal', 70, y + 40); g.fillText('IVA 15%', 70, y + 84); g.textAlign = 'right'; g.fillText(money(c.sub), W - 70, y + 40); g.fillText(money(c.iva), W - 70, y + 84); g.textAlign = 'left'; y += 120;
      rr(g, 70, y, W - 140, 120, 24); var gg = g.createLinearGradient(70, y, W - 70, y); gg.addColorStop(0, '#ffd600'); gg.addColorStop(1, '#ffb800'); g.fillStyle = gg; g.fill();
      g.fillStyle = '#10213a'; g.font = '600 32px Outfit, sans-serif'; g.fillText('TOTAL A PAGAR (USD)', 106, y + 72); g.textAlign = 'right'; g.font = '700 56px Outfit, sans-serif'; g.fillText(money(c.tot), W - 106, y + 82); g.textAlign = 'left';
      y += 190; g.fillStyle = '#c9d6e4'; g.font = '400 25px Outfit, sans-serif';
      ['Paga con tarjeta en: ' + d.url, 'Incluye: sobre con sello, música, cuenta regresiva, mapa, confirmación de asistencia y panel de respuestas.', 'Hasta 5 ediciones. Después de pagar, escríbele a Afrodita (WhatsApp 096 852 0688) con tu código para coordinar logo y colores.'].forEach(function (t) { y = wrap(g, t, 70, y, W - 140, 34) + 44; });
      g.fillStyle = '#6f87a3'; g.font = '400 22px Outfit, sans-serif'; g.fillText('El futuro no espera. Nosotros tampoco. Activa el poder.', 70, H - 50);
      var url = cv.toDataURL('image/png'); $('img').src = url; $('dl').href = url; $('dl').download = 'proforma-' + d.num + '.png';
      $('pay').href = d.url; $('pay').hidden = false; $('wa2').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Afrodita 👋 tengo la proforma ' + d.num + ' (' + money(c.tot) + ') de ' + d.co + '.' + (d.note ? ' ' + d.note : ''));
      $('out').hidden = false; $('out').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    ok();
  }
  var C = window.INSECRET_CONFIG || {}, FN = (C.supabaseUrl || '') + '/functions/v1/compra', ERR = { BAD_PHONE: 'Revisa el WhatsApp: 10 dígitos, empieza con 09 u 08.', BAD_DOC: 'El RUC debe tener 13 dígitos (o cédula de 10).', BAD_EMAIL: 'Revisa el correo.', RATE: 'Hiciste varias proformas seguidas. Espera un rato o habla con Afrodita.', LINK: 'No pudimos preparar el pago. Intenta de nuevo o habla con Afrodita.', NETWORK: 'Sin conexión. Intenta de nuevo.' };
  function call(body) { return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey }, body: JSON.stringify(body) }).then(function (r) { return r.json().catch(function () { return {}; }); }, function () { return { error: 'NETWORK' }; }); }
  var poll = null;
  function watch(code, co, total) {
    clearTimeout(poll); var t0 = Date.now();
    (function tick() { call({ action: 'proforma_estado', code: code }).then(function (r) {
      if (r.status === 'paid') { $('st-line').textContent = '✅ ¡Pago recibido! Escríbele a Afrodita con tu código y seguimos.'; $('pay').hidden = true; return; }
      if (Date.now() - t0 < 1800e3) poll = setTimeout(tick, 4000);
    }); })();
  }
  $('make').addEventListener('click', function () {
    err(''); var c = render(), co = $('c-co').value.trim(), name = $('c-name').value.trim(), tel = $('c-tel').value.replace(/[^\d]/g, ''), ruc = $('c-ruc').value.replace(/\D/g, ''), mail = $('c-mail').value.trim(), note = $('c-note').value.trim();
    if (co.length < 2) return err('Escribe el nombre de tu empresa.');
    if (name.length < 2) return err('Escribe tu nombre.');
    if (!/^(09|08)\d{8}$/.test(tel)) return err('Escribe un WhatsApp de 10 dígitos que empiece con 09 o 08.');
    if (ruc && !/^(\d{10}|\d{13})$/.test(ruc)) return err('El RUC debe tener 13 dígitos (o cédula de 10).');
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return err('Revisa el correo.');
    var btn = $('make'); btn.disabled = true; btn.textContent = 'Preparando tu proforma…';
    call({ action: 'proforma_crear', kind: KIND, people: c.n, company: co, contact: name, phone: tel, ruc: ruc, email: mail, note: note, web: $('c-web').value }).then(function (r) {
      btn.disabled = false; btn.textContent = 'Generar proforma (imagen)';
      if (!r.ok || !r.code) return err(ERR[r.error] || 'No se pudo generar la proforma. Intenta de nuevo o habla con Afrodita.');
      var z = new Date(Date.now() - 5 * 3600e3), p2 = function (v) { return ('0' + v).slice(-2); };
      var date = p2(z.getUTCDate()) + '/' + p2(z.getUTCMonth() + 1) + '/' + z.getUTCFullYear();
      var cc = { n: c.n, rows: c.rows, sub: r.base_cents / 100, iva: r.iva_cents / 100, tot: r.total_cents / 100 };
      var go = function () { draw(cc, { co: co, name: name, tel: tel, ruc: ruc, mail: mail, date: date, num: r.code, url: r.url, note: note }); watch(r.code, co, cc.tot); };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
    });
  });
  render();
})();
