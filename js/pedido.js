/* Estado del pedido: espera el pago y muestra los enlaces */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = window.INSECRET_CONFIG || {}, FN = C.supabaseUrl + '/functions/v1/compra', ORIGIN = location.origin;
  var QS = new URLSearchParams(location.search), CODE = (QS.get('c') || '').toUpperCase();
  if (!/^INS-[A-Z0-9]{11}$/.test(CODE)) { try { CODE = localStorage.getItem('ins_order') || ''; } catch (e) {} }
  function show(id) { ['st-wait', 'st-pay', 'st-ok', 'st-bad'].forEach(function (x) { $(x).hidden = x !== id; }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2200); }
  function money(c) { return '$' + (c / 100).toFixed(2).replace('.', ','); }
  function call(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }); }, function () { return { error: 'NETWORK' }; });
  }
  if (!/^INS-[A-Z0-9]{11}$/.test(CODE)) { show('st-bad'); return; }
  var t0 = Date.now(), shown = false, timer = null;
  function done(r) {
    clearTimeout(timer); show('st-ok');
    var inv = ORIGIN + '/invitacion/?i=' + r.slug;
    $('ok-title').textContent = '«' + (r.title || '') + '»';
    $('l-inv').value = inv; $('l-host').value = ORIGIN + '/anfitrion/?h=' + r.host_token; $('l-edit').value = ORIGIN + '/editar/?e=' + r.edit_token;
    $('ok-view').href = inv;
    $('ok-wa').href = 'https://wa.me/?text=' + encodeURIComponent('💌 Tienes una invitación' + (r.title ? ' · ' + r.title : '') + '\n' + inv);
    try { localStorage.removeItem('ins_order'); } catch (e) {}
    call({ action: 'editar_get', token: r.edit_token }).then(function (g) { if (g && g.config) share(g.theme, g.config, inv); });
  }

  /* ---------- entregable: texto + imagen para mandar por WhatsApp ---------- */
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fecha(d) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(d || ''); if (!m) return ''; var dt = new Date(+m[1], +m[2] - 1, +m[3]); return { dia: DIA[dt.getDay()], txt: (+m[3]) + ' de ' + MES[+m[2] - 1], hora: m[4] + ':' + m[5], largo: DIA[dt.getDay()] + ' ' + (+m[3]) + ' de ' + MES[+m[2] - 1] + ' · ' + m[4] + ':' + m[5] }; }
  var TH = {
    navidad: { img: '../assets/deco/nav-hero.webp', bg: ['#052a25', '#021613'], acc: '#e8c36a', ink: '#fff6e0', mut: '#bcd3c9', btn: '#e8c36a', btnInk: '#1a1405', emo: '🎄', eyebrow: 'Cena navideña' },
    fin: { dy: -34, img: '../assets/deco/fin-hero.webp', bg: ['#0a0c1c', '#04050d'], acc: '#e3c27a', ink: '#fff7df', mut: '#b9bfd3', btn: '#e3c27a', btnInk: '#1a1405', emo: '🥂', eyebrow: 'Fin de año' },
    cumple: { img: '../assets/mail/cumple.jpg', bg: ['#fff3d2', '#ffe6a8'], acc: '#b97a12', ink: '#14185c', mut: '#4a4f86', btn: '#14185c', btnInk: '#fff6dc', emo: '🎂', eyebrow: 'Cumpleaños' },
    cita: { img: '../assets/mail/cita.jpg', bg: ['#3a0a18', '#1d0309'], acc: '#f3a9b6', ink: '#fff0f0', mut: '#e6b9c0', btn: '#f3a9b6', btnInk: '#2a0610', emo: '💘', eyebrow: 'Cita especial' }
  };
  function loadImg(src) { return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }
  function spaced(c, t, x, y, gap) { var w = 0, i; for (i = 0; i < t.length; i++) w += c.measureText(t[i]).width + gap; w -= gap; var cx = x - w / 2; c.textAlign = 'left'; for (i = 0; i < t.length; i++) { c.fillText(t[i], cx, y); cx += c.measureText(t[i]).width + gap; } c.textAlign = 'center'; }
  function wrap(c, t, maxW) { var words = t.split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var test = cur ? cur + ' ' + w : w; if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }); if (cur) lines.push(cur); return lines; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function draw(theme, cfg) {
    var T = TH[theme] || TH.navidad, W = 1080, H = 1350, cv = $('card'), c = cv.getContext('2d'); cv.width = W; cv.height = H;
    return Promise.all([loadImg(T.img), loadImg('../assets/logo.png'), document.fonts.load('700 80px "Playfair Display"'), document.fonts.load('600 36px "Outfit"'), document.fonts.load('400 30px "Outfit"')]).then(function (a) {
      var img = a[0], logo = a[1], f = fecha(cfg.date);
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      var BH = 520;
      if (img) { var k = Math.max(W / img.width, BH / img.height), w = img.width * k, h = img.height * k; c.drawImage(img, (W - w) / 2, (BH - h) / 2 + (T.dy || 0), w, h); }
      var px = img ? c.getImageData(8, BH - 6, 1, 1).data : null, e0 = px ? 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')' : T.bg[0], e1 = px ? 'rgba(' + px[0] + ',' + px[1] + ',' + px[2] + ',0)' : T.bg[0] + '00';
      var fade = c.createLinearGradient(0, BH - 110, 0, BH); fade.addColorStop(0, e1); fade.addColorStop(1, e0); c.fillStyle = fade; c.fillRect(0, BH - 110, W, 110);
      var lo = c.createLinearGradient(0, BH, 0, H); lo.addColorStop(0, e0); lo.addColorStop(.18, T.bg[0]); lo.addColorStop(1, T.bg[1]); c.fillStyle = lo; c.fillRect(0, BH, W, H - BH);
      c.strokeStyle = T.acc; c.globalAlpha = .55; c.lineWidth = 3; rr(c, 28, 28, W - 56, H - 56, 34); c.stroke(); c.globalAlpha = 1;
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = T.acc; c.font = '600 30px Outfit, sans-serif'; spaced(c, 'ESTÁS INVITADO', W / 2, 596, 9);
      var host = (cfg.host || '').trim(); if (host) { c.fillStyle = T.mut; c.font = '400 32px Outfit, sans-serif'; c.fillText('de ' + host, W / 2, 640); }
      var title = (cfg.title || '').trim(), size = 92, lines;
      c.fillStyle = T.ink;
      for (; size >= 52; size -= 4) { c.font = '700 ' + size + 'px "Playfair Display", Georgia, serif'; lines = wrap(c, title, 880); if (lines.length <= 3 && lines.length * size * 1.12 <= 200 && lines.every(function (l) { return c.measureText(l).width <= 900; })) break; }
      var y = 660 + size * 1.0; lines.forEach(function (l) { c.fillText(l, W / 2, y); y += size * 1.12; });
      y += 6; c.strokeStyle = T.acc; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2 - 150, y); c.lineTo(W / 2 - 18, y); c.moveTo(W / 2 + 18, y); c.lineTo(W / 2 + 150, y); c.stroke();
      c.save(); c.translate(W / 2, y); c.rotate(Math.PI / 4); c.fillStyle = T.acc; c.fillRect(-7, -7, 14, 14); c.restore();
      y += 58;
      if (f) { c.fillStyle = T.ink; c.font = '600 42px Outfit, sans-serif'; c.fillText(f.dia.charAt(0).toUpperCase() + f.dia.slice(1) + ' ' + f.txt, W / 2, y); y += 48; c.fillStyle = T.acc; c.font = '600 36px Outfit, sans-serif'; c.fillText(f.hora + ' h', W / 2, y); y += 50; }
      if (cfg.place) { c.fillStyle = T.mut; c.font = '400 32px Outfit, sans-serif'; var pl = cfg.place; while (c.measureText(pl).width > 880 && pl.length > 4) pl = pl.slice(0, -2); if (pl !== cfg.place) pl = pl.replace(/[\s,]+$/, '') + '…'; c.fillText(pl, W / 2, y); y += 42; }
      var by = 1122;
      c.fillStyle = T.btn; rr(c, W / 2 - 330, by, 660, 84, 42); c.fill();
      c.fillStyle = T.btnInk; c.font = '700 36px Outfit, sans-serif'; c.fillText('Abre tu invitación interactiva', W / 2, by + 54);
      if (logo) c.drawImage(logo, W / 2 - 150, H - 124, 52, 52);
      c.fillStyle = T.acc; c.font = '600 28px Outfit, sans-serif'; c.textAlign = 'left'; c.fillText('Poseidón · Invitaciones', W / 2 - 88, H - 88); c.textAlign = 'center';
      return T;
    });
  }
  function texto(theme, cfg, inv) {
    var T = TH[theme] || TH.navidad, f = fecha(cfg.date), host = (cfg.host || '').trim();
    var L = [T.emo + ' ¡Estás invitado! ' + T.emo, '', '✨ ' + (cfg.title || '') + (host ? ' · de ' + host : '')];
    if (f) L.push('📅 ' + f.largo.charAt(0).toUpperCase() + f.largo.slice(1) + ' h');
    if (cfg.place) L.push('📍 ' + cfg.place);
    L.push('', 'Abre tu invitación aquí 👇', inv, '', 'Ahí podrás ver los detalles y confirmar tu asistencia 💌');
    return L.join('\n');
  }
  function share(theme, cfg, inv) {
    var msg = texto(theme, cfg, inv); $('msg').value = msg; $('ok-wa').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    draw(theme, cfg).then(function () { $('share').hidden = false; });
    $('cp-msg').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(function () { toast('Texto copiado'); }, function () { $('msg').select(); toast('Selecciónalo y cópialo'); }); };
    function blob() { return new Promise(function (ok) { $('card').toBlob(ok, 'image/png'); }); }
    $('dl-img').onclick = function () { blob().then(function (b) { var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'invitacion.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast('Imagen descargada'); }); };
    if (navigator.canShare && navigator.share) { $('sh-img').hidden = false; $('sh-img').onclick = function () { blob().then(function (b) { var file = new File([b], 'invitacion.png', { type: 'image/png' }); if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: msg }).catch(function () {}); else toast('Descarga la imagen y pega el texto'); }); }; }
  }
  function tick() {
    call({ action: 'estado', code: CODE }).then(function (r) {
      if (r.error === 'NOT_FOUND') { show('st-bad'); return; }
      if (r.status === 'paid') return done(r);
      if (r.status === 'pending') {
        if (!shown) {
          shown = true; show('st-pay'); $('pay-title').textContent = '«' + (r.title || '') + '»'; $('pay-amt').textContent = money(r.amount_cents || 1484) + ' (IVA incluido)'; $('pay-code').textContent = CODE;
          if (/^https:\/\//.test(r.pay_url || '')) $('pay-go').href = r.pay_url; else { $('pay-go').removeAttribute('href'); $('pay-go').textContent = 'No se pudo preparar el pago'; }
        }
        if (Date.now() - t0 > 90e3) $('pay-late').hidden = false;
      }
      timer = setTimeout(tick, Date.now() - t0 > 600e3 ? 15000 : 3000);
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-cp]'); if (!b) return; var v = $(b.dataset.cp).value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('Copiado'); }, function () { $(b.dataset.cp).select(); toast('Selecciónalo y cópialo'); }); });
  tick();
})();
