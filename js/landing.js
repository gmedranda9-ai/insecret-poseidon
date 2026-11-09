(function () {
  'use strict';
  var q = location.search;
  /* enlaces viejos del sorteo que quedaron en la raíz: llevarlos a su página */
  if (/[?&](g|o|t|demo)=/.test(q)) { location.replace('amigo-secreto/' + q + location.hash); return; }

  /* contador de sorteos guardados en este dispositivo */
  try {
    var raw = localStorage.getItem('insecret_org'), n = 0;
    if (raw) { try { var a = JSON.parse(raw); n = Array.isArray(a) ? a.length : 1; } catch (e) { n = 1; } }
    if (n) { var b = document.getElementById('org-n'); b.textContent = n; b.hidden = false; }
  } catch (e) {}

  /* inclinación 3D de las tarjetas */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.querySelectorAll('.door').forEach(function (d) {
    d.addEventListener('pointermove', function (e) {
      var r = d.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      d.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg'); d.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    });
    d.addEventListener('pointerleave', function () { d.style.setProperty('--rx', '0deg'); d.style.setProperty('--ry', '0deg'); });
  });

  /* nieve y chispas de fondo */
  var cv = document.getElementById('fx'), cx = cv.getContext('2d'), W, H, P = [], DPR = Math.min(2, devicePixelRatio || 1), last = 0;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  size(); addEventListener('resize', size);
  function mk() {
    var gold = Math.random() < .3;
    return { x: Math.random() * W, y: -10, r: gold ? 1.5 + Math.random() * 2 : 1.5 + Math.random() * 3, vy: 14 + Math.random() * 34, ph: Math.random() * 6.28, c: gold ? '#fed405' : (Math.random() < .5 ? '#ffffff' : '#7fe8ff'), tw: gold };
  }
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000 || .016); last = t; cx.clearRect(0, 0, W, H);
    if (P.length < (W < 600 ? 40 : 80) && Math.random() < .5) P.push(mk());
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i]; p.y += p.vy * dt; p.x += Math.sin(t / 900 + p.ph) * 12 * dt;
      if (p.y > H + 10) { P.splice(i, 1); continue; }
      cx.globalAlpha = p.tw ? .5 + .5 * Math.sin(t / 200 + p.ph) : .75; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28); cx.fill();
    }
    requestAnimationFrame(frame);
  }
  if (!reduce) requestAnimationFrame(frame);
})();
