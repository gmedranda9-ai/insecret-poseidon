/* Invitación interactiva de ejemplo · Poseidón */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var WA = '593982354338';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON = {
    it: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    dr: '<path d="M8 4l4 3 4-3 4 3-2 3-2-1v11H8V9L6 10 4 7z"/>',
    me: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
    pl: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    gi: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 9v11M4 13h16M12 9c-3 0-4-4-1.5-4S12 9 12 9zm0 0c3 0 4-4 1.5-4S12 9 12 9z"/>'
  };
  var CHEV = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

  var T = {"navidad": {"glyph": "N", "orn": "pino", "fx": "nieve", "chime": [523.25, 659.25, 783.99, 1046.5]}, "fin": {"glyph": "27", "orn": "burbujas", "fx": "chispas", "chime": [392, 523.25, 659.25, 783.99]}, "boda": {"glyph": "&", "orn": "olivo", "fx": "petalos", "chime": [440, 554.37, 659.25, 880]}, "cumple": {"glyph": "30", "orn": "confeti", "fx": "confeti", "chime": [523.25, 659.25, 783.99, 1046.5, 1318.5]}, "cita": {"glyph": "♥", "orn": "corazon", "fx": "corazones", "chime": [392, 493.88, 587.33, 783.99]}};
  Object.keys(T).forEach(function (k) { Object.keys(window.INV_DEF[k]).forEach(function (f) { T[k][f] = window.INV_DEF[k][f]; }); });
  var DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var cur = 'navidad', tick = null, rsvp = { ans: null, n: 1 }, soundOn = true, dodges = 0, TOYSTATE = {};

  /* ---------- adornos SVG ---------- */
  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function leafPair(x, y, a, l) {
    var o = '';
    [-1, 1].forEach(function (d) {
      o += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q' + (d * l * .6).toFixed(1) + ' ' + (-l * .7).toFixed(1) + ' ' + (d * l).toFixed(1) + ' ' + (-l * .25).toFixed(1) +
        ' q' + (-d * l * .35).toFixed(1) + ' ' + (l * .5).toFixed(1) + ' ' + (-d * l).toFixed(1) + ' ' + (l * .25).toFixed(1) + '"/>';
    });
    return o;
  }
  var ORN = {
    pino: function () {
      var o = '<g stroke="url(#fg)" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M30 64C100 52 220 52 290 64"/>';
      for (var i = 0; i < 12; i++) { var x = 56 + i * 19.5, y = 59 - Math.sin(i / 11 * Math.PI) * 6.5, up = 24 - Math.abs(5.5 - i) * 1.5;
        o += '<path d="M' + x + ' ' + y + ' l-10 -' + up + '"/><path d="M' + x + ' ' + y + ' l10 -' + up + '"/><path d="M' + x + ' ' + y + ' l-9 ' + up * .55 + '"/><path d="M' + x + ' ' + y + ' l9 ' + up * .55 + '"/>'; }
      return o + '</g><g fill="#c4162b"><circle cx="160" cy="56" r="7"/><circle cx="142" cy="61" r="5"/><circle cx="178" cy="61" r="5"/></g><g fill="#fff" opacity=".5"><circle cx="158" cy="53" r="1.8"/></g>';
    },
    burbujas: function () {
      var r = seeded(7), o = '<g fill="none" stroke="url(#fg)" stroke-width="1.6">';
      for (var i = 0; i < 24; i++) o += '<circle cx="' + (30 + r() * 260).toFixed(1) + '" cy="' + (12 + r() * 66).toFixed(1) + '" r="' + (2 + r() * 6).toFixed(1) + '"/>';
      return o + '</g><path d="M160 14l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill="url(#fg)"/>';
    },
    olivo: function () {
      var o = '<g fill="none" stroke="url(#fg)" stroke-width="2" stroke-linecap="round"><path d="M40 70C90 60 130 46 150 26"/><path d="M280 70C230 60 190 46 170 26"/>';
      for (var i = 0; i < 6; i++) { var t = i / 5; o += '<g>' + leafPair(62 + t * 78, 66 - t * 38 - Math.sin(t * 3) * 3, 0, 14) + '</g><g>' + leafPair(258 - t * 78, 66 - t * 38 - Math.sin(t * 3) * 3, 0, 14) + '</g>'; }
      return o + '</g><g fill="none" stroke="url(#fg)" stroke-width="2.6"><circle cx="153" cy="36" r="11"/><circle cx="167" cy="36" r="11"/></g>';
    },
    confeti: function () {
      var r = seeded(11), col = ['#ff4f9a', '#1620b8', '#ff6b35', '#14185c'], o = '';
      for (var i = 0; i < 30; i++) {
        var x = (14 + r() * 292).toFixed(1), y = (8 + r() * 70).toFixed(1), c = col[i % 4], a = (r() * 180).toFixed(0);
        o += i % 3 ? '<rect x="' + x + '" y="' + y + '" width="9" height="4.5" rx="1.5" fill="' + c + '" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>'
                   : '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="' + c + '"/>';
      }
      return o;
    },
    corazon: function () {
      return '<path d="M160 74C112 46 112 14 138 14c10 0 18 6 22 14 4-8 12-14 22-14 26 0 26 32-22 60z" fill="none" stroke="url(#fg)" stroke-width="3"/>' +
        '<g fill="url(#fg)"><circle cx="80" cy="44" r="2.6"/><circle cx="62" cy="58" r="1.8"/><circle cx="240" cy="44" r="2.6"/><circle cx="258" cy="58" r="1.8"/></g>' +
        '<path d="M40 70h60M220 70h60" stroke="url(#fg)" stroke-width="1.5" opacity=".6"/>';
    }
  };
  var FOIL = { navidad: ['#b8862b', '#fff0c0', '#d9ab4a'], fin: ['#b99b62', '#fff9e6', '#d3b87c'], boda: ['#9c7a2c', '#fff2c4', '#b8913a'], cumple: ['#14185c', '#14185c', '#14185c'], cita: ['#c88a95', '#fff1ee', '#d9959f'] };
  function drawOrn(k) {
    var f = FOIL[k];
    $('orn').innerHTML = '<defs><linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="' + f[0] + '"/><stop offset=".5" stop-color="' + f[1] + '"/><stop offset="1" stop-color="' + f[2] + '"/></linearGradient></defs>' + ORN[T[k].orn]();
  }

  /* ---------- partículas (ambiente y estallido) ---------- */
  var cv = $('fx'), cx = cv.getContext('2d'), P = [], W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), raf = null, last = 0;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener('resize', size); size();
  var PAL = {
    nieve: ['#ffffff', '#dff1ff'], chispas: ['#f6e7c1', '#d8bd82', '#fff9e6'], petalos: ['#f2c8cf', '#f8e1dc', '#e9b3bd', '#dfe8d2'],
    confeti: ['#ff4f9a', '#ffd23f', '#ffffff', '#ff6b35', '#7cf0ff'], corazones: ['#ff8fa8', '#ff5d7d', '#ffd1da', '#c4163f']
  };
  function mk(kind, burst, ox, oy) {
    var pal = PAL[kind], c = pal[Math.floor(Math.random() * pal.length)], p = { kind: kind, c: c, r: 2 + Math.random() * 3.5, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 3, ph: Math.random() * 6.28, life: 1 };
    if (burst) { var a = Math.random() * 6.28, sp = 120 + Math.random() * 380; p.x = ox; p.y = oy; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 160; p.g = 520; p.burst = true; p.life = 1; p.r += 1.5; }
    else {
      p.x = Math.random() * W; p.y = kind === 'chispas' || kind === 'corazones' ? H + 10 : -10; p.burst = false;
      var d = { nieve: [8, 34], petalos: [22, 46], confeti: [50, 110], chispas: [-26, -70], corazones: [-18, -48] }[kind]; p.vy = d[0] + Math.random() * (d[1] - d[0]); p.vx = (Math.random() - .5) * 18; p.g = 0;
      if (kind === 'petalos') p.r = 4 + Math.random() * 4; if (kind === 'corazones') p.r = 5 + Math.random() * 7;
    }
    return p;
  }
  function heart(x, y, s) { cx.beginPath(); cx.moveTo(x, y + s * .35); cx.bezierCurveTo(x - s, y - s * .4, x - s * .5, y - s, x, y - s * .45); cx.bezierCurveTo(x + s * .5, y - s, x + s, y - s * .4, x, y + s * .35); cx.fill(); }
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000 || .016); last = t; cx.clearRect(0, 0, W, H);
    var kind = T[cur].fx, want = innerWidth < 600 ? 34 : 60, n = 0;
    P.forEach(function (p) { if (!p.burst && p.kind === kind) n++; });
    if (n < want && Math.random() < .5) P.push(mk(kind, false));
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      if (p.burst) { p.vy += p.g * dt; p.vx *= .992; p.life -= dt * .55; }
      p.x += (p.vx + (p.burst ? 0 : Math.sin(t / 900 + p.ph) * 14)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      var off = p.y > H + 20 || p.y < -30 || p.life <= 0 || p.x < -30 || p.x > W + 30;
      if (off || (!p.burst && p.kind !== kind && (Math.random() < .02))) { P.splice(i, 1); continue; }
      cx.save(); cx.globalAlpha = p.burst ? Math.max(0, p.life) : (p.kind === 'chispas' ? .45 + .45 * Math.sin(t / 220 + p.ph) : .8);
      cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
      if (p.kind === 'confeti' || (p.burst && p.kind === 'confeti')) cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      else if (p.kind === 'petalos') { cx.beginPath(); cx.ellipse(0, 0, p.r * 1.6, p.r * .8, 0, 0, 6.28); cx.fill(); }
      else if (p.kind === 'corazones') heart(0, 0, p.r);
      else { cx.beginPath(); cx.arc(0, 0, p.r * (p.kind === 'chispas' ? .55 : 1), 0, 6.28); cx.fill(); }
      cx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  function burstAt(x, y, kind, n, pal) {
    if (reduce) return;
    for (var i = 0; i < n; i++) { var p = mk(kind, true, x, y); if (pal) p.c = pal[i % pal.length]; P.push(p); }
  }
  function burst(el) {
    if (reduce) return; var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var kind = T[cur].fx; var pk = kind === 'nieve' ? 'confeti' : kind;
    for (var i = 0; i < 110; i++) P.push(mk(pk === 'confeti' || kind === 'nieve' ? 'confeti' : kind, true, x, y));
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); } else if (!reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } });


  /* ---------- música ambiente por ocasión (piano sintetizado) ---------- */
  var AC = null, MASTER = null, FX_IN = null, mt = null, mStep = 0, mNext = 0, mTheme = null;
  var MUS = {
    navidad: { bpm: 86, kind: 'bell', chords: [[48, 55, 60, 64, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62]], pat: [0, 2, 3, 4, 3, 2, 3, 1] },
    fin: { bpm: 100, kind: 'piano', chords: [[50, 57, 60, 64, 67], [43, 50, 59, 62, 66], [48, 55, 59, 64, 67], [45, 52, 55, 60, 64]], pat: [0, 2, 4, 3, 2, 4, 3, 2] },
    boda: { bpm: 68, kind: 'piano', chords: [[50, 57, 62, 66, 69], [45, 52, 57, 61, 64], [47, 54, 59, 62, 66], [42, 49, 54, 57, 61], [43, 50, 55, 59, 62], [50, 57, 62, 66, 69], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]], pat: [0, 2, 3, 4, 3, 2, 4, 3] },
    cumple: { bpm: 124, kind: 'pluck', chords: [[48, 55, 60, 64, 67], [53, 57, 60, 65, 69], [43, 50, 55, 59, 62], [48, 55, 60, 64, 67]], pat: [0, 3, 2, 4, 0, 3, 2, 4] },
    cita: { bpm: 60, kind: 'piano', chords: [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]], pat: [0, 2, 3, 4, 3, 2, 1, 2], pad: true }
  };
  function ctx() {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      MASTER = AC.createGain(); MASTER.gain.value = .5; MASTER.connect(AC.destination);
      var dl = AC.createDelay(1); dl.delayTime.value = .27; var fb = AC.createGain(); fb.gain.value = .34; var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      FX_IN = AC.createGain(); FX_IN.gain.value = .35; FX_IN.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(MASTER);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function note(m, t, dur, vel, kind) {
    var f = 440 * Math.pow(2, (m - 69) / 12), o1 = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), g2 = AC.createGain();
    o1.type = kind === 'pluck' ? 'triangle' : (kind === 'bell' ? 'sine' : 'triangle'); o1.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * (kind === 'bell' ? 3.01 : 2); g2.gain.value = kind === 'bell' ? .35 : .22;
    var d = kind === 'pluck' ? dur * .45 : dur;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(MASTER); g.connect(FX_IN);
    o1.start(t); o2.start(t); o1.stop(t + d + .05); o2.stop(t + d + .05);
  }
  function padNote(m, t, dur) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + .05);
  }
  function stopMusic() { clearInterval(mt); mt = null; mTheme = null; }
  function startMusic(k) {
    stopMusic(); if (!soundOn || reduce) return; ctx(); var M = MUS[k]; mTheme = k; mStep = 0; mNext = AC.currentTime + .1;
    var eighth = 60 / M.bpm / 2;
    mt = setInterval(function () {
      if (mTheme !== k) return;
      while (mNext < AC.currentTime + .25) {
        var bar = Math.floor(mStep / 8) % M.chords.length, ch = M.chords[bar], i = mStep % 8, idx = M.pat[i];
        if (i === 0) { note(ch[0] - 12, mNext, eighth * 7, .14, M.kind === 'pluck' ? 'piano' : M.kind); if (M.pad) ch.slice(1, 4).forEach(function (m) { padNote(m, mNext, eighth * 8.5); }); }
        note(ch[idx], mNext, eighth * (i % 2 ? 3 : 4.5), i === 0 ? .17 : .11 + (i % 4 === 0 ? .03 : 0), M.kind);
        mNext += eighth; mStep++;
      }
    }, 60);
  }
  var gestured = false;
  document.addEventListener('pointerdown', function () { if (gestured) return; gestured = true; if (soundOn) startMusic(cur); }, { once: false });
  function chime(notes) {
    if (!soundOn) return;
    try { ctx(); (notes || T[cur].chime).forEach(function (f, i) { var m = 69 + 12 * Math.log2(f / 440); note(m, AC.currentTime + i * .12, 1.6, .18, 'bell'); }); } catch (e) {}
  }
  $('snd').addEventListener('click', function () {
    soundOn = !soundOn; this.setAttribute('aria-pressed', String(soundOn)); this.textContent = soundOn ? '🔔' : '🔕'; this.setAttribute('aria-label', soundOn ? 'Sonido activado' : 'Sonido apagado');
    gestured = true; if (soundOn) startMusic(cur); else stopMusic();
  });


  /* ---------- el momento "wow" de cada ocasión ---------- */
  function centerOf(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function buildToy(k) {
    var el = $('toy'); el.onclick = null; TOYSTATE = { lit: 0, n: 0, held: 0 };
    if (k === 'navidad') {
      var pos = [[110, 70], [150, 92], [76, 98], [118, 118], [166, 128], [62, 150], [104, 152], [150, 168]], col = ['#ff5a5a', '#ffd23f', '#5ad1ff', '#ff8fd0', '#9cff6a', '#ffb347', '#c39bff', '#fff'];
      el.innerHTML = '<h3>Enciende el árbol</h3><p>Toca las luces. Si las enciendes todas, pasa algo.</p><svg viewBox="0 0 220 230" width="220" role="img" aria-label="Árbol de Navidad">' +
        '<polygon points="110,18 168,92 140,92 190,150 150,150 205,205 15,205 70,150 30,150 80,92 52,92" fill="#1d5a3f" stroke="#0e3a28" stroke-width="2" data-tree="1"/>' +
        '<rect x="98" y="205" width="24" height="18" fill="#6b4423"/><polygon class="tstar" id="tstar" points="110,2 114,13 126,13 116,20 120,32 110,25 100,32 104,20 94,13 106,13"/>' +
        pos.map(function (p, i) { return '<circle class="bulb" data-b="' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="9" style="color:' + col[i] + '"/>'; }).join('') + '</svg>' +
        '<p class="count-tx" id="tcount">0 de 8 luces</p><p class="win" id="twin"></p>';
      var cols = col;
      el.onclick = function (e) {
        var b = e.target.closest('[data-b]'), tr = e.target.closest('[data-tree]'); if (!b && !tr) return;
        var bs = el.querySelectorAll('.bulb'), target = b || Array.prototype.filter.call(bs, function (x) { return !x.classList.contains('on'); })[0]; if (!target) return;
        var on = !target.classList.contains('on'); target.classList.toggle('on', on); target.style.fill = on ? cols[+target.dataset.b] : ''; 
        var n = el.querySelectorAll('.bulb.on').length; $('tcount').textContent = n + ' de 8 luces'; if (on) chime([880 + n * 70, 1174.7 + n * 70]);
        var all = n === 8; $('tstar').classList.toggle('on', all); $('twin').classList.toggle('on', all); $('twin').textContent = all ? '¡Feliz Navidad!' : '';
        if (all) { var c = centerOf($('tstar')); burstAt(c[0], c[1], 'confeti', 120, ['#ffffff', '#ffe27a', '#ff5a5a', '#5ad1ff']); chime([523.25, 659.25, 783.99, 1046.5, 1318.5]); }
      };
    } else if (k === 'fin') {
      el.innerHTML = '<h3>Brinda con nosotros</h3><p>Toca las copas.</p><svg viewBox="0 0 220 150" width="220" role="img" aria-label="Dos copas"><g class="glass l"><path d="M58 20h42l-6 50c-1 10-9 16-15 16s-14-6-15-16z" fill="rgba(246,231,193,.28)" stroke="#d8bd82" stroke-width="3"/><path d="M62 38h34l-3 30c-1 8-7 14-14 14s-13-6-14-14z" fill="#e8c97a" opacity=".85"/><path d="M79 86v38M62 126h34" stroke="#d8bd82" stroke-width="3" stroke-linecap="round"/></g><g class="glass r"><path d="M120 20h42l-6 50c-1 10-9 16-15 16s-14-6-15-16z" fill="rgba(246,231,193,.28)" stroke="#d8bd82" stroke-width="3"/><path d="M124 38h34l-3 30c-1 8-7 14-14 14s-13-6-14-14z" fill="#e8c97a" opacity=".85"/><path d="M141 86v38M124 126h34" stroke="#d8bd82" stroke-width="3" stroke-linecap="round"/></g></svg><p class="count-tx" id="bcount">Brindis: 0</p><p class="win" id="bwin"></p>';
      el.onclick = function () {
        TOYSTATE.n++; el.classList.add('clink'); setTimeout(function () { el.classList.remove('clink'); }, 320); $('bcount').textContent = 'Brindis: ' + TOYSTATE.n;
        chime([1318.5, 1760]); var pal = ['#f6e7c1', '#d8bd82', '#ffffff', '#ffb347', '#7cf0ff'], w = innerWidth, h = innerHeight;
        for (var i = 0; i < 3; i++) setTimeout(function () { burstAt(w * (.15 + Math.random() * .7), h * (.15 + Math.random() * .4), 'chispas', 70, pal); }, i * 220);
        $('bwin').classList.add('on'); $('bwin').textContent = ['¡Salud!', '¡Por el 2027!', '¡Otra vez!', '¡Feliz año!'][TOYSTATE.n % 4];
      };
    } else if (k === 'boda') {
      el.innerHTML = '<div class="petal-zone" id="pz"><h3>Lanza los pétalos</h3><p>Toca en cualquier parte de este cuadro.</p><svg viewBox="0 0 200 90" width="200" role="img" aria-label="Anillos"><g fill="none" stroke="url(#fg2)" stroke-width="4"><circle cx="86" cy="46" r="26"/><circle cx="114" cy="46" r="26"/></g><defs><linearGradient id="fg2"><stop offset="0" stop-color="#9c7a2c"/><stop offset=".5" stop-color="#fff2c4"/><stop offset="1" stop-color="#b8913a"/></linearGradient></defs><path d="M100 8l5 8-5 8-5-8z" fill="#c9a24b"/></svg><p class="count-tx" id="pcount">Pétalos lanzados: 0</p></div>' +
        '<div class="guest"><input id="gmsg" type="text" maxlength="70" placeholder="Déjales un deseo (Ej. ¡Sean muy felices!)"><button class="big" id="gsend" type="button">Dejar mi deseo</button><ul id="glist"></ul></div>';
      $('pz').onclick = function (e) { TOYSTATE.n += 40; $('pcount').textContent = 'Pétalos lanzados: ' + TOYSTATE.n; burstAt(e.clientX, e.clientY, 'petalos', 40, ['#f2c8cf', '#f8e1dc', '#e9b3bd', '#dfe8d2', '#ffffff']); chime([659.25, 987.77]); };
      $('gsend').onclick = function () {
        var v = $('gmsg').value.trim(); if (!v) return; var li = document.createElement('li'); li.textContent = '💌 ' + v; $('glist').prepend(li); $('gmsg').value = '';
        var c = centerOf($('gsend')); burstAt(c[0], c[1], 'petalos', 30, ['#f2c8cf', '#e9b3bd', '#ffffff']); chime([523.25, 783.99, 1046.5]);
      };
    } else if (k === 'cumple') {
      var xs = [70, 110, 150];
      el.innerHTML = '<h3>¡Sopla las velas!</h3><p>Toca el pastel para soplar.</p><svg viewBox="0 0 220 170" width="230" role="img" aria-label="Pastel con velas" id="cake" style="cursor:pointer">' +
        '<ellipse cx="110" cy="152" rx="96" ry="10" fill="rgba(20,24,92,.18)"/><rect x="30" y="100" width="160" height="46" rx="8" fill="#ff4f9a"/><rect x="30" y="100" width="160" height="14" rx="7" fill="#fff" opacity=".9"/><rect x="48" y="66" width="124" height="36" rx="8" fill="#ff6b35"/><rect x="48" y="66" width="124" height="12" rx="6" fill="#fff" opacity=".9"/>' +
        xs.map(function (x, i) { return '<rect x="' + (x - 4) + '" y="36" width="8" height="30" rx="2" fill="#1620b8"/><path class="flame" data-f="' + i + '" d="M' + x + ' 14c6 8 8 14 0 22-8-8-6-14 0-22z" fill="#ffd23f" stroke="#ff6b35" stroke-width="1.5"/><circle class="smoke" data-s="' + i + '" cx="' + x + '" cy="22" r="4" fill="#777"/>'; }).join('') + '</svg>' +
        '<p class="win" id="cwin"></p><button class="big" id="creset" type="button" hidden>Encender otra vez</button>';
      $('cake').onclick = function () {
        var fl = el.querySelectorAll('.flame:not(.off)'); if (!fl.length) return; var f = fl[0]; f.classList.add('off'); var s = el.querySelector('[data-s="' + f.dataset.f + '"]'); s.classList.add('on'); chime([880 + fl.length * 100]);
        if (fl.length === 1) { var c = centerOf($('cake')); burstAt(c[0], c[1], 'confeti', 160); $('cwin').classList.add('on'); $('cwin').textContent = '¡Feliz cumpleaños!'; chime([523.25, 659.25, 783.99, 1046.5, 1318.5]); $('creset').hidden = false; }
      };
      $('creset').onclick = function () { el.querySelectorAll('.flame').forEach(function (f) { f.classList.remove('off'); }); el.querySelectorAll('.smoke').forEach(function (s) { s.classList.remove('on'); }); $('cwin').classList.remove('on'); this.hidden = true; };
    } else {
      el.innerHTML = '<h3>Mantén presionado el corazón</h3><p>Si quieres aceptar, no lo sueltes.</p><svg class="holdheart beat" id="hh" viewBox="0 0 160 150" width="170" role="img" aria-label="Corazón"><defs><clipPath id="hc"><path d="M80 138C20 98 14 54 44 36c16-9 31-2 36 14 5-16 20-23 36-14 30 18 24 62-36 102z"/></clipPath></defs>' +
        '<path d="M80 138C20 98 14 54 44 36c16-9 31-2 36 14 5-16 20-23 36-14 30 18 24 62-36 102z" fill="rgba(255,143,168,.15)" stroke="#ff8fa8" stroke-width="4"/><g clip-path="url(#hc)"><rect class="fillrect" id="hfill" x="0" y="150" width="160" height="150" fill="#ff4d77"/></g></svg><p class="count-tx" id="hpct">0%</p><p class="win" id="hwin"></p>';
      var hh = $('hh'), lvl = 0, hold = false, raf2 = null, done = false;
      function loop() {
        lvl = done ? 100 : Math.max(0, Math.min(100, lvl + (hold ? 1.7 : -2.4))); $('hfill').setAttribute('y', 150 - lvl * 1.4); $('hpct').textContent = Math.round(lvl) + '%';
        if (lvl >= 100 && !done) { done = true; hold = false; var c = centerOf(hh); burstAt(c[0], c[1], 'corazones', 130); chime([392, 493.88, 587.33, 783.99, 987.77]); $('hwin').classList.add('on'); $('hwin').textContent = 'Sabía que dirías que sí 💗'; pick('si'); if (navigator.vibrate) navigator.vibrate(60); }
        if (lvl > 0 || hold) raf2 = requestAnimationFrame(loop); else raf2 = null;
      }
      function down(e) { e.preventDefault(); if (done) return; hold = true; if (!raf2) raf2 = requestAnimationFrame(loop); }
      function up() { hold = false; }
      hh.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); hh.addEventListener('pointerleave', up); hh.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  }

  /* ---------- tema ---------- */
  function parse(s) { var p = s.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); return new Date(+p[1], p[2] - 1, +p[3], +p[4], +p[5]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function titleChars(txt) {
    var i = 0; return txt.split(' ').map(function (w) { return '<span class="w">' + w.split('').map(function (ch) { return '<span class="ch" style="--i:' + (i++) + '">' + esc(ch) + '</span>'; }).join('') + '</span>'; }).join(' ');
  }
  function tile(id, icon, label, body) {
    return '<div class="tile" data-id="' + id + '"><button type="button" aria-expanded="false" aria-controls="tb-' + id + '"><span class="ti"><svg viewBox="0 0 24 24">' + ICON[icon] + '</svg></span><span class="tl">' + esc(label) + '</span><span class="tc">' + CHEV + '</span></button>' +
      '<div class="tb" id="tb-' + id + '" role="region"><div class="tbi"><div class="tbc">' + body + '</div></div></div></div>';
  }
  var CLK = { tm: 0, t: null }, DIET = [], GARM = '#e0b04b';
  function setClock(i, first) {
    var li = document.querySelector('.timeline li[data-i="' + i + '"]'); if (!li) return;
    var p = li.dataset.h.split(':'), tm = (+p[0]) * 60 + (+p[1]);
    if (!first) while (tm < CLK.tm) tm += 1440;
    CLK.tm = tm; var hh = $('hand-h'), mm = $('hand-m'); if (!hh) return;
    if (first) { hh.style.transition = mm.style.transition = 'none'; }
    hh.style.transform = 'rotate(' + (tm * .5) + 'deg)'; mm.style.transform = 'rotate(' + (tm * 6) + 'deg)';
    if (first) { void hh.offsetWidth; hh.style.transition = mm.style.transition = ''; }
    $('clk-t').textContent = li.dataset.h + ' h'; $('clk-d').textContent = li.dataset.d;
    document.querySelectorAll('.timeline li').forEach(function (x) { x.classList.toggle('now', x === li); x.classList.toggle('past', +x.dataset.i < i); });
    $('prog').style.height = (i / Math.max(1, T[cur].it.length - 1) * 100) + '%';
    if (!first) chime([660 + i * 90]);
  }
  function playClock() {
    clearInterval(CLK.t); var n = T[cur].it.length, i = 0; setClock(0, true);
    CLK.t = setInterval(function () { i++; if (i >= n) { clearInterval(CLK.t); var c = centerOf($('clock')); burstAt(c[0], c[1], T[cur].fx, 50); return; } setClock(i); }, 1200);
  }
  function buildTiles(t) {
    DIET = []; GARM = t.dress[1][0]; clearInterval(CLK.t);
    var ticks = ''; for (var q = 0; q < 12; q++) ticks += '<line x1="60" y1="9" x2="60" y2="' + (q % 3 ? 14 : 18) + '" transform="rotate(' + q * 30 + ' 60 60)"/>';
    var clock = '<div class="clockwrap"><svg id="clock" class="clock" viewBox="0 0 120 120" role="img" aria-label="Reloj del evento"><circle cx="60" cy="60" r="55" class="cf"/><g class="ct">' + ticks + '</g><line id="hand-h" class="hh" x1="60" y1="60" x2="60" y2="30"/><line id="hand-m" class="hm" x1="60" y1="60" x2="60" y2="17"/><circle cx="60" cy="60" r="4" class="cd"/></svg><div><div class="clk-t" id="clk-t">--</div><div class="clk-d" id="clk-d">Toca un momento</div></div></div>';
    var it = clock + '<ol class="timeline"><i class="prog" id="prog"></i>' + t.it.map(function (x, i) { return '<li style="--i:' + i + '" data-i="' + i + '" data-h="' + esc(x[0]) + '" data-d="' + esc(x[1]) + '" tabindex="0"><b>' + esc(x[0]) + ' h</b>' + esc(x[1]) + '</li>'; }).join('') + '</ol>';
    var dr = '<p>' + esc(t.dress[0]) + '</p><div class="garm"><svg viewBox="0 0 120 130" width="130" aria-hidden="true"><path d="M60 4c-4 0-7 3-7 6 0 2 2 3 4 3" fill="none" stroke="var(--ink-soft)" stroke-width="2"/><path d="M60 13L14 38h92z" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-linejoin="round"/><path id="garm" d="M44 40l-6 4-5 30 12 3-6 46h54l-6-46 12-3-5-30-6-4c-3 8-8 12-16 12s-13-4-16-12z" style="fill:' + GARM + '" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/></svg></div>' +
      '<div class="swatches">' + t.dress[1].map(function (c, i) { return '<button type="button" class="sw' + (i ? '' : ' on') + '" data-c="' + c + '" style="background:' + c + ';--i:' + i + '" aria-label="Color ' + (i + 1) + '"></button>'; }).join('') + '</div><small>Toca un color y mira cómo luce.</small>';
    var dishIc = '<svg viewBox="0 0 24 24"><path d="M3 15h18M5 15a7 7 0 0114 0M12 8V6M10 6h4M4 19h16"/></svg>';
    var me = '<div class="dishes">' + t.menu.map(function (m, i) { return '<button type="button" class="dish" data-d="' + i + '" style="--i:' + i + '"><span class="di">' + dishIc + '</span><span><small>' + esc(m[0]) + '</small><b>' + esc(m[1]) + '</b></span><span class="hrt" aria-label="Me encanta">♡</span></button>'; }).join('') + '</div>' +
      '<p class="diet-t">¿Alguna dieta o alergia?</p><div class="chips">' + ['Vegetariano', 'Sin gluten', 'Sin lácteos', 'Sin mariscos'].map(function (c) { return '<button type="button" class="chip" aria-pressed="false">' + c + '</button>'; }).join('') + '</div><small>Lo que marques se agrega a tu confirmación.</small>';
    var q2 = encodeURIComponent(t.place + ', ' + t.mapq);
    var pl = '<div class="mapv"><svg viewBox="0 0 300 150" role="img" aria-label="Mapa ilustrado"><rect width="300" height="150" class="mb"/><g class="mr"><path d="M0 40h300M0 100h300M60 0v150M170 0v150M250 0v150"/></g><path class="mp" d="M30 128H60V100H170V40H250" /><circle cx="30" cy="128" r="5" class="ms"/><g class="pin" transform="translate(250 40)"><circle r="16" class="ring"/><path d="M0 0c-9-12-12-17-12-23a12 12 0 0124 0c0 6-3 11-12 23z" transform="translate(0 -2)" class="pb"/><circle cy="-25" r="4.5" fill="#fff"/></g></svg></div><p><b>' + esc(t.place) + '</b></p><p><a class="btn-map" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=' + q2 + '">Cómo llegar · Google Maps</a></p>' + (REAL ? '' : '<small>Hay parqueadero cerca. Si vienes en taxi, llega 10 minutos antes.</small>') + '';
    var ex = '<button type="button" class="gift" aria-label="Abrir sorpresa"><svg viewBox="0 0 100 90" width="110"><g class="lid"><rect x="8" y="24" width="84" height="18" rx="3" fill="var(--accent)"/><rect x="45" y="24" width="10" height="18" fill="rgba(255,255,255,.55)"/><path d="M50 24c-14-18-30-6-18 0M50 24c14-18 30-6 18 0" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="4" stroke-linecap="round"/></g><rect x="14" y="42" width="72" height="42" rx="3" fill="var(--accent)" opacity=".85"/><rect x="45" y="42" width="10" height="42" fill="rgba(255,255,255,.55)"/></svg><span>Toca para abrir</span></button><p class="gtx">' + esc(t.extra[2]) + '</p>';
    var has = { it: t.it && t.it.length, dr: t.dress && t.dress[0], me: t.menu && t.menu.length, pl: t.place, ex: t.extra && t.extra[1] };
    $('tiles').innerHTML = (has.it ? tile('it', 'it', 'Itinerario', it) : '') + (has.dr ? tile('dr', 'dr', 'Vestimenta', dr) : '') + (has.me ? tile('me', 'me', 'Menú', me) : '') + (has.pl ? tile('pl', 'pl', 'Lugar', pl + mapEmbed(t)) : '') + (has.ex ? tile('ex', t.extra[0] || 'gi', t.extra[1], ex) : '');
  }

  /* decoración de la portada */
  function treeSvg() {
    var bulbs = [[150, 60], [128, 84], [172, 90], [108, 118], [150, 112], [190, 124], [84, 160], [124, 150], [172, 156], [214, 166], [62, 196], [104, 192], [150, 190], [198, 200], [240, 198]], cols = ['#ffd86b', '#ff5a5f', '#4fd8ff', '#fff4d6', '#ff9f43'];
    return '<svg viewBox="0 0 300 250"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f8a55"/><stop offset="1" stop-color="#0f5a36"/></linearGradient></defs>' +
      '<path d="M150 32L96 100h108z" fill="url(#tg)"/><path d="M150 72L68 156h164z" fill="url(#tg)"/><path d="M150 112L44 214h212z" fill="url(#tg)"/><rect x="136" y="214" width="28" height="36" fill="#5a3a22"/>' +
      '<path class="star" d="M150 6l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#ffd86b"/>' +
      bulbs.map(function (b, i) { return '<circle class="bl" cx="' + b[0] + '" cy="' + b[1] + '" r="5" fill="' + cols[i % 5] + '" style="color:' + cols[i % 5] + ';--d:' + ((i * 37 % 10) / 10).toFixed(1) + '"/>'; }).join('') + '</svg>';
  }
  function fireSvg() {
    var cols = ['#ffd86b', '#4fd8ff', '#ffffff', '#ff8fd0'], B = [[80, 82], [150, 44], [225, 90], [112, 128], [196, 138]], out = '';
    B.forEach(function (b, k) {
      var c = cols[k % 4], l = '';
      for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2, x2 = b[0] + Math.cos(a) * 34, y2 = b[1] + Math.sin(a) * 34, x1 = b[0] + Math.cos(a) * 12, y1 = b[1] + Math.sin(a) * 12; l += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/><circle cx="' + (b[0] + Math.cos(a) * 40).toFixed(1) + '" cy="' + (b[1] + Math.sin(a) * 40).toFixed(1) + '" r="1.8"/>'; }
      out += '<g class="fw" style="--d:' + (k * .55).toFixed(2) + 's;transform-origin:' + b[0] + 'px ' + b[1] + 'px;color:' + c + '" stroke="' + c + '" fill="' + c + '" stroke-width="2.4" stroke-linecap="round">' + l + '</g>';
    });
    return '<svg viewBox="0 0 300 250">' + out + '</svg>';
  }
  function ringsSvg() {
    var sp = ''; [[70, 50], [236, 60], [150, 22], [92, 150], [214, 148]].forEach(function (s, i) { sp += '<path class="spk" style="--d:' + (i * .4) + 's;transform-origin:' + s[0] + 'px ' + s[1] + 'px" d="M' + s[0] + ' ' + (s[1] - 9) + 'q1 8 9 9q-8 1-9 9q-1-8-9-9q8-1 9-9z" fill="#fff4c9"/>'; });
    return '<svg viewBox="0 0 300 250"><defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".5" stop-color="#d9b04a"/><stop offset="1" stop-color="#9c7a2c"/></linearGradient></defs><g class="rings"><circle cx="124" cy="104" r="44" fill="none" stroke="url(#gr)" stroke-width="9"/><circle cx="176" cy="104" r="44" fill="none" stroke="url(#gr)" stroke-width="9"/><path d="M150 66a44 44 0 010 76" fill="none" stroke="url(#gr)" stroke-width="9"/></g>' + sp + '</svg>';
  }
  function balloonsSvg() {
    var B = [[88, 98, '#ff4f9a', 0], [150, 64, '#fed405', .7], [212, 100, '#02d4fc', 1.4]], o = '';
    B.forEach(function (b) { o += '<g class="bal" style="--d:' + b[3] + 's;transform-origin:' + b[0] + 'px 260px"><path d="M' + b[0] + ' ' + (b[1] + 40) + 'Q' + (b[0] + 8) + ' 190 150 262" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/><ellipse cx="' + b[0] + '" cy="' + b[1] + '" rx="31" ry="39" fill="' + b[2] + '"/><ellipse cx="' + (b[0] - 10) + '" cy="' + (b[1] - 14) + '" rx="7" ry="11" fill="rgba(255,255,255,.45)"/><path d="M' + b[0] + ' ' + (b[1] + 39) + 'l-5 8h10z" fill="' + b[2] + '"/></g>'; });
    return '<svg viewBox="0 0 300 250">' + o + '</svg>';
  }
  function heartSvg() {
    var s = ''; [[60, 150, .0], [244, 140, .6], [96, 60, 1.2], [214, 52, 1.8]].forEach(function (h, i) { s += '<path class="fh" style="--d:' + h[2] + 's" transform="translate(' + h[0] + ' ' + h[1] + ') scale(.22)" d="M0 40C-60 0 -60-50 -25-50 -10-50 0-38 0-30 0-38 10-50 25-50 60-50 60 0 0 40z" fill="#ff8fa8"/>'; });
    return '<svg viewBox="0 0 300 250"><defs><radialGradient id="hg" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffb3c4"/><stop offset="1" stop-color="#e0446a"/></radialGradient></defs><g class="hb"><path d="M150 150C86 108 86 50 124 50 140 50 150 63 150 72 150 63 160 50 176 50 214 50 214 108 150 150z" fill="url(#hg)"/><path d="M122 66q-10 6-8 22" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="4" stroke-linecap="round"/></g>' + s + '</svg>';
  }
  var DECO = { navidad: treeSvg, fin: fireSvg, boda: ringsSvg, cumple: balloonsSvg, cita: heartSvg };
  function mapHref(t) { return /^https:\/\/(www\.google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)/i.test(t.maplink || '') ? t.maplink : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t.place + ', ' + (t.mapq || '')); }
  function mapEmbed(t) {
    var m = (t.maplink || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/), q = m ? m[1] + ',' + m[2] : t.place + ', ' + (t.mapq || '');
    return '<iframe class="mapframe" loading="lazy" referrerpolicy="no-referrer" title="Mapa del lugar" src="https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed"></iframe>';
  }

  /* ---------- decoración de la tarjeta + recorrido por pasos ---------- */
  function flake(cx0, cy0, r) {
    var a = '';
    for (var i = 0; i < 6; i++) { var ang = i * 60; a += '<g transform="rotate(' + ang + ' ' + cx0 + ' ' + cy0 + ')"><line x1="' + cx0 + '" y1="' + cy0 + '" x2="' + cx0 + '" y2="' + (cy0 - r) + '"/><path d="M' + cx0 + ' ' + (cy0 - r * .55) + 'l-' + r * .22 + ' -' + r * .2 + 'M' + cx0 + ' ' + (cy0 - r * .55) + 'l' + r * .22 + ' -' + r * .2 + 'M' + cx0 + ' ' + (cy0 - r * .8) + 'l-' + r * .15 + ' -' + r * .14 + 'M' + cx0 + ' ' + (cy0 - r * .8) + 'l' + r * .15 + ' -' + r * .14 + '"/></g>'; }
    return '<g>' + a + '</g>';
  }
  function orn(x, len, r, c1, c2, d, kind) {
    var g = '<g class="swing" style="transform-origin:' + x + 'px 0;animation-delay:' + d + 's"><line x1="' + x + '" y1="0" x2="' + x + '" y2="' + len + '" stroke="#e3c27a" stroke-width="1.3"/>';
    if (kind === 'star') { var pts = [], R = r, rr = r * .45; for (var i = 0; i < 10; i++) { var ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? rr : R; pts.push((x + Math.cos(ang) * rad).toFixed(1) + ',' + (len + R + Math.sin(ang) * rad).toFixed(1)); } return g + '<polygon points="' + pts.join(' ') + '" fill="url(#gold)"/></g>'; }
    return g + '<rect x="' + (x - 4) + '" y="' + len + '" width="8" height="6" rx="1.5" fill="#caa24e"/><circle cx="' + x + '" cy="' + (len + 6 + r) + '" r="' + r + '" fill="url(#' + c1 + ')"/><ellipse cx="' + (x - r * .35) + '" cy="' + (len + 6 + r * .6) + '" rx="' + r * .22 + '" ry="' + r * .35 + '" fill="rgba(255,255,255,.55)"/><path d="M' + (x - r * .8) + ' ' + (len + 6 + r) + 'q' + r * .8 + ' ' + r * .5 + ' ' + r * 1.6 + ' 0" fill="none" stroke="' + c2 + '" stroke-width="1.6" opacity=".7"/></g>';
  }
  var FOOT = { navidad: ['snowman', 'santa'], boda: ['jm-roses', 'jm-car', 'jm-carry'], cumple: ['feliz-cumple'], cita: ['love-date'], fin: [] };
  function cardDeco(k) {
    var el = $('cdeco'), eb = $('cdeco-b'); el.innerHTML = ''; eb.innerHTML = '';
    var ha = $('hero-art'); ha.className = 'hero-art ha-' + k; var fa = $('foot-art'); fa.className = 'foot-art fa-' + k; fa.innerHTML = document.body.classList.contains('corp') ? '' : (FOOT[k] || []).map(function (s, i) { return '<img src="../assets/deco/' + s + '.webp" alt="" style="--i:' + i + '">'; }).join('');
    if (k !== 'navidad' && k !== 'fin') return;
    var defs = '<defs><radialGradient id="rd" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ff7a82"/><stop offset="1" stop-color="#b3202f"/></radialGradient><radialGradient id="gd" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#b8862b"/></radialGradient><radialGradient id="sl" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8fa4b8"/></radialGradient><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#c9992f"/></linearGradient></defs>';
    var orns = '';
    el.innerHTML = '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMin meet">' + defs + '<path id="wire" d="M-6 6Q50 56 100 24T200 30T300 24T406 8" fill="none" stroke="#6b6046" stroke-width="1.6"/><g id="bulbs"></g>' + orns + '</svg>';
    var wire = el.querySelector('#wire'), bulbs = el.querySelector('#bulbs'), L = wire.getTotalLength(), N = 15, cols = k === 'navidad' ? ['#ffd86b', '#ff5a5f', '#4fd8ff', '#fff4d6', '#7dff9a'] : ['#ffe9a8', '#fff', '#ffd86b', '#fff4d6'];
    for (var i = 0; i <= N; i++) {
      var pt = wire.getPointAtLength(L * i / N), c = cols[i % cols.length];
      bulbs.insertAdjacentHTML('beforeend', '<g class="bulb" data-i="' + i + '" style="--c:' + c + ';--d:' + (i * .09).toFixed(2) + 's"><rect x="' + (pt.x - 2.5) + '" y="' + (pt.y - 1) + '" width="5" height="5" rx="1" fill="#6b6046"/><ellipse cx="' + pt.x.toFixed(1) + '" cy="' + (pt.y + 9).toFixed(1) + '" rx="4.6" ry="6.4"/></g>');
    }
    bulbs.addEventListener('click', function (e) { var b = e.target.closest('.bulb'); if (!b || !el.classList.contains('on')) return; var n = cols[(cols.indexOf(b.style.getPropertyValue('--c')) + 1) % cols.length]; b.style.setProperty('--c', n); chime([76]); });
    eb.innerHTML = '<svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMax meet"><g fill="none" stroke="#e3c27a" stroke-width="1.3" stroke-linecap="round" opacity=".38">' + flake(48, 100, 58) + flake(350, 78, 44) + flake(212, 128, 20) + '</g></svg>';
  }
  function lights(on) { $('cdeco').classList.toggle('on', on); }
  var SG = {}, LAB = { navidad: ['✨ Encender las luces', 'Ver más detalles', 'Confirmar mi asistencia'], fin: ['🥂 Brindemos', 'Ver más detalles', 'Confirmar mi asistencia'], boda: ['💍 Continuar', 'Ver más detalles', 'Responder'], cumple: ['🎉 ¡Sigue la fiesta!', 'Ver más detalles', 'Responder'], cita: ['💘 Continuar', 'Ver más detalles', 'Responder'] };
  function initStory() {
    var card = $('card'), q = function (s) { return card.querySelector(s); };
    [['sg2', [q('.when'), $('count')]], ['sg3', [$('toy'), q('.tap-hint'), $('tiles')]], ['sg4', [$('rsvp'), q('.tools')]]].forEach(function (g) {
      var w = document.createElement('div'); w.className = 'sg'; w.id = g[0]; g[1][0].parentNode.insertBefore(w, g[1][0]); g[1].forEach(function (n) { w.appendChild(n); }); SG[g[0]] = w;
    });
    [1, 2, 3].forEach(function (n) {
      var d = document.createElement('div'); d.className = 'sn'; d.id = 'sn' + n; d.hidden = true; d.innerHTML = '<button type="button" class="story-btn" data-n="' + n + '"></button>';
      SG['sg' + (n + 1)].parentNode.insertBefore(d, SG['sg' + (n + 1)]);
      d.querySelector('.story-btn').addEventListener('click', function () { revealStep(n); });
    });
    SG.sg4.appendChild($('foot-art'));
  }
  function revealStep(n) {
    $('sn' + n).hidden = true; var g = SG['sg' + (n + 1)]; g.classList.add('show');
    if (n === 1) { lights(true); chime([72, 76, 79, 84]); var r = $('cdeco').getBoundingClientRect(); burstAt(innerWidth / 2, r.top + 40, T[cur].fx === 'nieve' ? 'chispas' : T[cur].fx, 26); } else chime([76, 83]);
    if (n < 3) $('sn' + (n + 1)).hidden = false;
    setTimeout(function () { g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 80);
  }
  function resetStory() {
    if (!SG.sg2) return; lights(false);
    ['sg2', 'sg3', 'sg4'].forEach(function (k) { SG[k].classList.remove('show'); }); [2, 3].forEach(function (n) { $('sn' + n).hidden = true; }); $('sn1').hidden = false;
    var lb = LAB[cur] || LAB.navidad; [1, 2, 3].forEach(function (n) { $('sn' + n).querySelector('.story-btn').textContent = lb[n - 1]; });
  }
  function setTheme(k) {
    cur = k; var t = T[k], d = parse(t.date);
    document.body.setAttribute('data-theme', k);
    document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.body).getPropertyValue('--table').trim() || '#08190f';
    document.querySelectorAll('#themes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === k)); });
    $('glyph-a').textContent = $('glyph-b').textContent = t.glyph; $('deco').innerHTML = DECO[k] ? DECO[k]() : '';
    $('lead-big').textContent = t.lead; $('to-line').textContent = t.to;
    $('c-host').textContent = t.host; $('c-title').innerHTML = titleChars(t.title); $('c-title').setAttribute('aria-label', t.title); $('c-msg').textContent = t.msg;
    $('c-dow').textContent = DOW[d.getDay()]; $('c-num').textContent = d.getDate(); $('c-mon').textContent = MON[d.getMonth()];
    $('c-time').textContent = d.getHours() + ':' + pad(d.getMinutes()) + ' h'; $('c-year').textContent = d.getFullYear();
    $('map').href = mapHref(t);
    $('wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Poseidón 👋 Vi la invitación interactiva de «' + t.title + '» y quiero una para mi evento.');
    $('r-title').textContent = t.rsvp[0]; $('yes').textContent = t.rsvp[1]; $('no').textContent = t.rsvp[2];
    drawOrn(k); cardDeco(k); buildTiles(t); buildToy(k); resetRsvp(); resetStory(); closeEnvelope(); startCount(); if (gestured) startMusic(k);
    P = P.filter(function (p) { return p.burst; });
  }

  /* ---------- sobre ---------- */
  function closeEnvelope() {
    $('card').hidden = true; $('scene-env').classList.remove('gone'); $('env').classList.remove('open');
    $('seal').classList.remove('broken'); $('hint').hidden = false; $('again').hidden = true;
  }
  function openEnvelope() {
    var seal = $('seal'); if (seal.classList.contains('broken')) return;
    seal.classList.add('broken'); $('hint').hidden = true; chime(); burst(seal);
    var step = reduce ? 0 : 1;
    setTimeout(function () { $('env').classList.add('open'); }, 380 * step);
    setTimeout(function () {
      $('scene-env').classList.add('gone'); $('card').hidden = false; $('again').hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { var y = $('card').getBoundingClientRect().top + scrollY - 6; scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }); });
    }, 1700 * step);
  }
  $('seal').addEventListener('click', openEnvelope);
  $('again').addEventListener('click', function () { closeEnvelope(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  document.querySelectorAll('#themes button').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.t); b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }); });

  /* inclinación 3D del sobre al mover el dedo o el mouse */
  $('stage').addEventListener('pointermove', function (e) {
    if (reduce || $('env').classList.contains('open')) return; var r = this.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    $('env').style.setProperty('--ry', (nx * 14).toFixed(1) + 'deg'); $('env').style.setProperty('--rx', (-ny * 12).toFixed(1) + 'deg');
  });
  $('stage').addEventListener('pointerleave', function () { $('env').style.setProperty('--ry', '0deg'); $('env').style.setProperty('--rx', '0deg'); });

  /* acordeón + interacciones de cada botón */
  $('tiles').addEventListener('click', function (e) {
    var b = e.target.closest('.tile > button');
    if (b) {
      var tl = b.parentNode, open = !tl.classList.contains('open');
      tl.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
      if (open) {
        burst(tl.querySelector('.ti')); chime([784, 1046.5]);
        setTimeout(function () { tl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); }, 300);
        if (tl.dataset.id === 'it') setTimeout(playClock, 450); else clearInterval(CLK.t);
        if (tl.dataset.id === 'pl') { var pn = tl.querySelector('.pin'); pn.classList.remove('drop'); void pn.getBoundingClientRect(); pn.classList.add('drop'); }
      }
      return;
    }
    var li = e.target.closest('.timeline li'); if (li) { clearInterval(CLK.t); setClock(+li.dataset.i); return; }
    var sw = e.target.closest('.sw'); if (sw) { document.querySelectorAll('.sw').forEach(function (x) { x.classList.toggle('on', x === sw); }); $('garm').style.fill = sw.dataset.c; var c = centerOf($('garm')); burstAt(c[0], c[1], T[cur].fx, 24, [sw.dataset.c, '#ffffff']); chime([523.25 + (+sw.style.getPropertyValue('--i')) * 120]); return; }
    var ds = e.target.closest('.dish'); if (ds) { var on = !ds.classList.contains('liked'); ds.classList.toggle('liked', on); ds.querySelector('.hrt').textContent = on ? '♥' : '♡'; if (on) { var h = centerOf(ds.querySelector('.hrt')); burstAt(h[0], h[1], 'corazones', 14); chime([880, 1318.5]); } return; }
    var ch = e.target.closest('.chip'); if (ch) {
      var pr = ch.getAttribute('aria-pressed') !== 'true'; ch.setAttribute('aria-pressed', String(pr)); var v = ch.textContent, k = DIET.indexOf(v); if (pr && k < 0) DIET.push(v); if (!pr && k >= 0) DIET.splice(k, 1);
      var nt = $('note'); if (!nt.value || /^Dieta:/.test(nt.value)) nt.value = DIET.length ? 'Dieta: ' + DIET.join(', ') : ''; return;
    }
    var gf = e.target.closest('.gift'); if (gf && !gf.classList.contains('open')) { gf.classList.add('open'); gf.querySelector('span').textContent = '¡Sorpresa!'; var g = centerOf(gf); burstAt(g[0], g[1], T[cur].fx, 70); chime([523.25, 659.25, 783.99, 1046.5]); }
  });
  $('tiles').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.timeline li')) { e.preventDefault(); e.target.click(); } });

  /* ---------- cuenta regresiva ---------- */
  function startCount() {
    clearInterval(tick); var t = T[cur], end = parse(t.target || t.date);
    function paint() {
      var s = Math.max(0, Math.floor((end - new Date()) / 1000));
      $('k-d').textContent = pad(Math.floor(s / 86400)); $('k-h').textContent = pad(Math.floor(s % 86400 / 3600));
      $('k-m').textContent = pad(Math.floor(s % 3600 / 60)); $('k-s').textContent = pad(s % 60);
    }
    paint(); tick = setInterval(paint, 1000);
  }

  /* ---------- confirmación (demo: no se envía a ningún lado) ---------- */
  function resetRsvp() {
    rsvp = { ans: null, n: 1 }; dodges = 0; $('yes').setAttribute('aria-pressed', 'false'); $('no').setAttribute('aria-pressed', 'false'); $('no').style.transform = '';
    $('guests').hidden = true; $('who-in').hidden = true; $('rs-err').hidden = true; $('note-in').hidden = true; $('dodge').hidden = true; $('g-n').textContent = '1'; $('note').value = ''; $('send').disabled = true; $('send').hidden = false; $('done').hidden = true;
  }
  function pick(a) {
    rsvp.ans = a; $('yes').setAttribute('aria-pressed', String(a === 'si')); $('no').setAttribute('aria-pressed', String(a === 'no'));
    $('guests').hidden = a !== 'si' || !!T[cur].noguests; $('who-in').hidden = false; $('note-in').hidden = false; $('send').disabled = false;
    if (a === 'si') { burst($('yes')); chime(); }
  }
  $('yes').addEventListener('click', function () { pick('si'); });
  $('no').addEventListener('click', function () {
    if (cur === 'cita' && dodges < 3) { /* la cita romántica: el "no" se escapa tres veces */
      dodges++; var x = (Math.random() * 60 - 30) | 0, y = (Math.random() * 40 - 20) | 0; this.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (x / 3) + 'deg)';
      $('dodge').hidden = false; $('dodge').textContent = ['Mmm, ¿segura o seguro?', 'Piénsalo otra vez…', 'Última oportunidad 😉'][dodges - 1]; return;
    }
    $('dodge').hidden = true; this.style.transform = ''; pick('no');
  });
  $('g-minus').addEventListener('click', function () { rsvp.n = Math.max(1, rsvp.n - 1); $('g-n').textContent = rsvp.n; });
  $('g-plus').addEventListener('click', function () { rsvp.n = Math.min(10, rsvp.n + 1); $('g-n').textContent = rsvp.n; });
  $('send').addEventListener('click', function () {
    var name = $('who').value.trim(), note = $('note').value.trim(), er = $('rs-err'); er.hidden = true;
    if (!name) { er.textContent = 'Escribe tu nombre para que sepan quién eres.'; er.hidden = false; $('who').focus(); return; }
    function ok() {
      $('send').hidden = true; var d = $('done'); d.hidden = false;
      d.textContent = (rsvp.ans === 'si' ? '¡Listo, ' + name + '! ' + (T[cur].noguests ? 'Te esperamos.' : 'Contamos con ' + rsvp.n + (rsvp.n === 1 ? ' persona.' : ' personas.')) : 'Gracias por avisar, ' + name + '. Te vamos a extrañar.') + (note ? ' Anotamos: «' + note + '».' : '') +
        (REAL ? '' : ' (Ejemplo: en tu invitación, esta respuesta le llega al anfitrión en su panel privado.)');
      if (rsvp.ans === 'si') burst(d);
    }
    if (!REAL) return ok();
    var btn = $('send'); btn.disabled = true; btn.textContent = 'Enviando…';
    rpc('invite_rsvp', { p_slug: SLUG, p_name: name, p_answer: rsvp.ans, p_guests: rsvp.n, p_note: note }).then(function () { btn.textContent = 'Confirmar'; ok(); },
      function (e) { btn.disabled = false; btn.textContent = 'Confirmar'; er.textContent = e.message === 'BUSY' ? 'Esta invitación ya recibió muchas respuestas. Avísale al anfitrión.' : e.message === 'NOT_FOUND' ? 'Esta invitación ya no está disponible.' : 'No pudimos enviar tu respuesta. Revisa tu internet e inténtalo otra vez.'; er.hidden = false; });
  });

  /* ---------- calendario .ics ---------- */
  $('ics').addEventListener('click', function () {
    var t = T[cur], d = parse(t.date), e = new Date(d.getTime() + 4 * 3600e3);
    function f(x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + 'T' + pad(x.getHours()) + pad(x.getMinutes()) + '00'; }
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Poseidon//Invitacion//ES', 'BEGIN:VEVENT', 'UID:' + cur + '-' + f(d) + '@poseidonmk.com',
      'DTSTAMP:' + f(new Date()), 'DTSTART;TZID=America/Guayaquil:' + f(d), 'DTEND;TZID=America/Guayaquil:' + f(e), 'SUMMARY:' + t.title,
      'LOCATION:' + t.place, 'DESCRIPTION:' + t.msg, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'invitacion.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  });

  /* ---------- modo real: invitación de un cliente (?i=...) ---------- */
  var QS = new URLSearchParams(location.search), SLUG = (QS.get('i') || '').toLowerCase().replace(/[^a-z0-9-]/g, ''), GUEST = (QS.get('para') || '').trim().slice(0, 40), REAL = false;
  function rpc(fn, body) {
    var C = window.INSECRET_CONFIG || {};
    return fetch(C.supabaseUrl + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j && j.message || 'ERROR'); throw e; } return j; }); },
        function () { throw new Error('NETWORK'); });
  }
  var EDIT = ['corp', 'lead', 'to', 'host', 'title', 'msg', 'date', 'target', 'place', 'mapq', 'maplink', 'noguests', 'it', 'dress', 'menu', 'extra', 'rsvp'];
  function hexRGB(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function lum(h) { var c = hexRGB(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function mix(h, k) { return '#' + hexRGB(h).map(function (v) { return ('0' + Math.round(v * k).toString(16)).slice(-2); }).join(''); }
  function enableCorp(acc, theme_) {
    var a = /^#[0-9a-fA-F]{6}$/.test(acc || '') ? acc : '#1f3a5f', L = lum(a), s = document.body.style;
    document.body.classList.add('corp'); var dark = cur === 'navidad' || cur === 'fin' || theme_ === 'navidad' || theme_ === 'fin'; document.body.classList.toggle('corp-dark', dark); document.body.classList.toggle('corp-light', !dark);
    s.setProperty('--c-acc', a); s.setProperty('--c-on', L > .45 ? '#14161d' : '#ffffff');
    s.setProperty('--c-title', L < .3 ? a : (L < .6 ? mix(a, .6) : '#1d2433'));
    s.setProperty('--c-bg1', L < .06 ? '#141b30' : mix(a, .55)); s.setProperty('--c-bg2', L < .06 ? '#080b14' : mix(a, .22));
    s.setProperty('--accent', L < .3 ? a : '#8a6d2b'); s.setProperty('--c-card1', mix(L < .06 ? '#2a3a66' : a, .78)); s.setProperty('--c-card2', mix(L < .06 ? '#2a3a66' : a, .34));
  }
  function applyReal(theme, cfg) {
    var t = T[theme];
    EDIT.forEach(function (f) { if (cfg[f] !== undefined && cfg[f] !== null) t[f] = cfg[f]; });
    if (!cfg.target) delete t.target;
    var b = cfg.brand || {};
    if (b.accent && /^#[0-9a-fA-F]{6}$/.test(b.accent)) document.body.style.setProperty('--accent', b.accent);
    if (cfg.corp) enableCorp(b.accent, theme);
    if (b.logo && /^data:image\/(png|jpeg|webp);base64,/.test(b.logo)) { $('brand-logo').src = b.logo; $('brand-logo').hidden = false; $('logo-wrap').hidden = false; }
    if (b.sign) { $('sign').textContent = b.sign; $('sign').hidden = false; }
    document.title = (t.title || 'Invitación') + ' · Invitación';
  }
  function notFound() {
    document.body.classList.add('real');
    document.querySelector('main').innerHTML = '<section class="sell" style="margin-top:20vh"><h2>Esta invitación ya no está disponible</h2><p>Puede que el enlace esté mal escrito o que el evento ya haya pasado. Pídele el enlace al anfitrión.</p><p class="by">Hecho por <a href="https://poseidonmk.com" target="_blank" rel="noopener">Poseidón</a></p></section>';
  }
  initStory();
  function corpDemo(k) {
    var t = T[k]; t.corp = true; t.host = 'Empresa Ejemplo S.A.'; t.to = 'Para el equipo de Empresa Ejemplo'; t.lead = 'Estás cordialmente invitado'; t.noguests = true;
    t.title = k === 'fin' ? 'Cena de Fin de Año 2026' : 'Cena Navideña 2026'; t.msg = 'Gracias por un año de trabajo y compromiso. Celebremos juntos.'; t.place = 'Salón Principal'; t.mapq = 'Quito, Ecuador';
    document.body.classList.add('corp-demo'); $('brand-logo').src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="64" viewBox="0 0 140 64"><rect x="6" y="8" width="48" height="48" rx="10" fill="#0b2a5b"/><text x="30" y="43" font-size="30" text-anchor="middle" fill="#e3c27a" font-family="Georgia,serif" font-weight="700">E</text><text x="64" y="30" font-size="15" fill="#0b2a5b" font-family="Georgia,serif" font-weight="700">EMPRESA</text><text x="64" y="47" font-size="11" fill="#6a7080" font-family="Arial,sans-serif" letter-spacing="3">EJEMPLO S.A.</text></svg>');
    $('brand-logo').hidden = false; $('logo-wrap').hidden = false; $('sign').textContent = 'Con aprecio, Recursos Humanos'; $('sign').hidden = false;
  }
  function start(k) {
    if (!REAL && QS.get('corp') && (k === 'navidad' || k === 'fin')) { corpDemo(k); setTheme(k); enableCorp('#0b2a5b', k); return; }
    setTheme(k);
    if (GUEST) { $('to-line').textContent = 'Para ' + GUEST; $('who').value = GUEST; }
  }
  if (SLUG) {
    document.body.classList.add('real', 'loading');
    var meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.appendChild(meta);
    rpc('invite_get', { p_slug: SLUG }).then(function (r) {
      if (!T[r.theme]) return notFound();
      REAL = true; applyReal(r.theme, r.config || {}); document.body.classList.remove('loading'); start(r.theme);
    }, function () { notFound(); });
  } else {
    var q = QS.get('t'); start(T[q] ? q : 'navidad');
  }

})();
