/* Efectos visuales: nieve, confeti y tarjeta descargable. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nieve ---- */
  function snow() {
    var c = document.getElementById('snow'); if (!c || reduce) return;
    var x = c.getContext('2d'), W, H, flakes = [], N = 55, raf;
    function size() { W = c.width = innerWidth; H = c.height = innerHeight; }
    size(); addEventListener('resize', size);
    for (var i = 0; i < N; i++) flakes.push(mk(true));
    function mk(init) {
      return { x: Math.random() * W, y: init ? Math.random() * H : -10, r: Math.random() * 2.2 + .6,
        v: Math.random() * .6 + .25, d: Math.random() * Math.PI * 2, a: Math.random() * .5 + .25 };
    }
    function tick() {
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i]; f.y += f.v; f.d += .01; f.x += Math.sin(f.d) * .35;
        if (f.y > H + 10) flakes[i] = mk(false);
        x.beginPath(); x.fillStyle = 'rgba(214,240,255,' + f.a + ')'; x.arc(f.x, f.y, f.r, 0, 6.283); x.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else tick();
    });
    tick();
  }

  /* ---- Confeti ---- */
  function confetti() {
    if (reduce) return;
    var c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c);
    var x = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
    var cols = ['#fed405', '#02d4fc', '#009ee7', '#e6682b', '#ffffff'], ps = [], i;
    for (i = 0; i < 130; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 80, y: H * .45, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 3,
      s: Math.random() * 7 + 4, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - .5) * .3 });
    var t = 0;
    (function step() {
      x.clearRect(0, 0, W, H); t++;
      ps.forEach(function (p) { p.vy += .28; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= .99;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (t < 170) requestAnimationFrame(step); else c.remove();
    })();
  }

  /* ---- Tarjeta descargable (PNG 1080x1350) ---- */
  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line); return lines;
  }
  function fit(ctx, text, maxW, start, font) {
    var s = start; do { ctx.font = font.replace('{s}', s); s -= 4; } while (ctx.measureText(text).width > maxW && s > 40);
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function cardBlob(d) {
    var loadFonts = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('700 80px "Playfair Display"'), document.fonts.load('500 40px "Outfit"')]).catch(function () {})
      : Promise.resolve();
    return loadFonts.then(function () {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); }; img.onerror = function () { resolve(null); };
        img.src = 'assets/logo.png';
      });
    }).then(function (logo) {
      var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d'), SER = '"Playfair Display",Georgia,serif', SAN = 'Outfit,system-ui,sans-serif', i;
      var g = x.createLinearGradient(0, 0, W * .6, H); g.addColorStop(0, '#040a14'); g.addColorStop(.55, '#06214f'); g.addColorStop(1, '#00369f');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var rg = x.createRadialGradient(W * .85, H * .1, 10, W * .85, H * .1, 600); rg.addColorStop(0, 'rgba(2,212,252,.28)'); rg.addColorStop(1, 'rgba(2,212,252,0)');
      x.fillStyle = rg; x.fillRect(0, 0, W, H);
      var rg2 = x.createRadialGradient(W * .1, H * .95, 10, W * .1, H * .95, 560); rg2.addColorStop(0, 'rgba(230,104,43,.25)'); rg2.addColorStop(1, 'rgba(230,104,43,0)');
      x.fillStyle = rg2; x.fillRect(0, 0, W, H);
      for (i = 0; i < 70; i++) { // nieve fija
        x.beginPath(); x.fillStyle = 'rgba(220,242,255,' + (Math.random() * .5 + .2) + ')';
        x.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, 6.283); x.fill();
      }
      x.lineWidth = 4; x.strokeStyle = '#fed405'; rr(x, 36, 36, W - 72, H - 72, 36); x.stroke();
      x.lineWidth = 1.5; x.strokeStyle = 'rgba(254,212,5,.4)'; rr(x, 54, 54, W - 108, H - 108, 28); x.stroke();

      x.textAlign = 'center';
      if (logo) {
        x.save(); x.beginPath(); x.arc(W / 2, 205, 90, 0, 6.283); x.clip(); x.drawImage(logo, W / 2 - 90, 115, 180, 180); x.restore();
        x.lineWidth = 3; x.strokeStyle = '#02d4fc'; x.beginPath(); x.arc(W / 2, 205, 92, 0, 6.283); x.stroke();
      }
      x.fillStyle = '#fed405'; x.font = '600 34px ' + SAN; x.fillText('I N S E C R E T   P O S E I D Ó N', W / 2, 355);

      x.fillStyle = '#9db3cc'; x.font = '500 44px ' + SAN; x.fillText('Mi amigo secreto es', W / 2, 470);
      fit(x, d.receiver, W - 200, 150, '700 {s}px ' + SER);
      var tg = x.createLinearGradient(200, 0, W - 200, 0); tg.addColorStop(0, '#fed405'); tg.addColorStop(.5, '#ffffff'); tg.addColorStop(1, '#e6682b');
      x.fillStyle = tg; x.fillText(d.receiver, W / 2, 610);

      var y = 720;
      function row(label, val) {
        x.textAlign = 'left'; x.fillStyle = '#02d4fc'; x.font = '600 28px ' + SAN; x.fillText(label.toUpperCase(), 120, y);
        x.fillStyle = '#ffffff'; x.font = '500 40px ' + SAN;
        var ls = wrap(x, val, W - 240); ls.slice(0, 2).forEach(function (l, k) { x.fillText(l, 120, y + 48 + k * 50); });
        y += 48 + Math.min(ls.length, 2) * 50 + 36; x.textAlign = 'center';
      }
      row('Grupo', d.group_name);
      row('Fecha del intercambio', d.dateText);
      row('Presupuesto', d.budgetText);
      if (d.wish) {
        x.textAlign = 'left'; x.fillStyle = '#02d4fc'; x.font = '600 28px ' + SAN; x.fillText('LE HARÍA ILUSIÓN', 120, y);
        x.fillStyle = '#ffffff'; x.font = '500 36px ' + SAN;
        var wl = wrap(x, d.wish, W - 240).slice(0, 3); wl.forEach(function (l, k) { x.fillText(l, 120, y + 46 + k * 46); });
        x.textAlign = 'center';
      }

      x.fillStyle = '#fed405'; x.font = 'italic 600 34px ' + SER; x.fillText('🤫  Es un secreto', W / 2, H - 175);
      x.fillStyle = '#9db3cc'; x.font = 'italic 600 30px ' + SER; x.fillText('El futuro no espera. Nosotros tampoco. Activa el poder.', W / 2, H - 120);
      x.fillStyle = '#5f7791'; x.font = '500 26px ' + SAN; x.fillText('insecret.poseidonmk.com', W / 2, H - 80);

      return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/png'); });
    });
  }

  window.InSecretFX = { snow: snow, confetti: confetti, cardBlob: cardBlob };
})();
