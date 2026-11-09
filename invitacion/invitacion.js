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

  var T = {
    navidad: { glyph: 'N', lead: 'Tienes una invitación', to: 'Para la familia y los amigos', host: 'La familia Andrade te invita a la', title: 'Cena de Navidad',
      msg: 'Una noche para brindar, comer rico y estar juntos.', date: '2026-12-24T20:00', place: 'Casa de los Andrade, Pedernales', mapq: 'Pedernales, Manabí, Ecuador', orn: 'pino',
      fx: 'nieve', chime: [523.25, 659.25, 783.99, 1046.5],
      it: [['20:00', 'Llegada y brindis de bienvenida'], ['21:00', 'Cena navideña'], ['23:00', 'Intercambio de amigo secreto'], ['00:00', 'Feliz Navidad: abrazos y villancicos']],
      dress: ['Rojo, verde o dorado. Un detalle navideño suma.', ['#b3202f', '#1d4a37', '#e0b04b']],
      menu: [['Entrada', 'Ensalada de manzana y nueces'], ['Fuerte', 'Pavo al horno con puré'], ['Postre', 'Pristiños y chocolate caliente']],
      extra: ['gi', 'Amigo secreto', 'Trae un regalo de máximo $10 envuelto, con el nombre de tu amigo secreto. Lo repartimos a las 23:00.'],
      rsvp: ['¿Nos acompañas?', 'Sí, voy', 'No puedo'] },
    fin: { glyph: '27', lead: 'Se acerca la medianoche', to: 'Para ti y tu acompañante', host: 'Despide el año con nosotros en la', title: 'Noche de fin de año',
      msg: 'Brindamos por lo vivido y recibimos el 2027 a medianoche.', date: '2026-12-31T21:00', target: '2027-01-01T00:00', place: 'Terraza del Mar, Manta', mapq: 'Manta, Manabí, Ecuador', orn: 'burbujas',
      fx: 'chispas', chime: [392, 523.25, 659.25, 783.99],
      it: [['21:00', 'Cóctel de bienvenida'], ['22:30', 'Cena servida'], ['23:50', 'Cuenta regresiva'], ['00:00', 'Brindis con champán'], ['00:30', 'Baile hasta el amanecer']],
      dress: ['Blanco y dorado. Brillos bienvenidos.', ['#f6f1e6', '#d8bd82', '#0a0f2a']],
      menu: [['Cóctel', 'Mini canapés y espumante'], ['Cena', 'Lomo en salsa de vino'], ['Brindis', 'Champán y uvas de la suerte']],
      extra: ['gi', 'Las 12 uvas', 'Habrá 12 uvas para cada uno. Pide un deseo con cada campanada.'],
      rsvp: ['¿Brindas con nosotros?', 'Sí, voy', 'No puedo'] },
    boda: { glyph: '&', lead: 'Nos casamos', to: 'Con todo nuestro cariño', host: 'Ana y Diego te invitan a su', title: 'Ana & Diego',
      msg: 'Después de siete años, decimos que sí. Queremos que estés ahí.', date: '2027-02-20T16:00', place: 'Jardín Los Cocos, Portoviejo', mapq: 'Portoviejo, Manabí, Ecuador', orn: 'olivo',
      fx: 'petalos', chime: [440, 554.37, 659.25, 880],
      it: [['16:00', 'Ceremonia en el jardín'], ['17:00', 'Cóctel y fotos'], ['19:00', 'Cena'], ['21:00', 'Primer baile y fiesta'], ['23:30', 'Despedida con luces']],
      dress: ['Formal en tonos pastel. Evita el blanco: es de la novia.', ['#e8c9c0', '#b9c7b0', '#d8c38a']],
      menu: [['Cóctel', 'Ceviche en copa y canapés'], ['Cena', 'Filete con risotto o corvina al coco'], ['Postre', 'Torta de bodas y mesa de dulces']],
      extra: ['gi', 'Tu mejor regalo', 'Tu presencia es lo que más queremos. Si deseas tener un detalle, habrá una urna de sobres en la entrada.'],
      rsvp: ['¿Nos acompañas en este día?', 'Con mucho gusto', 'No podré ir'] },
    cumple: { glyph: '30', lead: '¡Estás invitado a la fiesta!', to: 'Para mis favoritos', host: 'Daniela te invita a su fiesta de', title: 'Daniela cumple 30',
      msg: 'Piscina, música y pastel. Ven con ganas de bailar.', date: '2027-01-16T16:00', place: 'Quinta Las Palmas, Pedernales', mapq: 'Pedernales, Manabí, Ecuador', orn: 'confeti',
      fx: 'confeti', chime: [523.25, 659.25, 783.99, 1046.5, 1318.5],
      it: [['16:00', 'Llegada y piscina'], ['17:30', 'Música y juegos'], ['18:30', 'Pastel y canción'], ['19:30', 'Baile hasta cansarnos']],
      dress: ['Ropa fresca. Trae traje de baño y toalla.', ['#ff4f9a', '#ffd23f', '#1620b8']],
      menu: [['Para picar', 'Mini pizzas y nachos'], ['Fuerte', 'Parrillada'], ['Postre', 'Pastel de chocolate y helados']],
      extra: ['gi', 'Lista de deseos', 'Daniela no necesita nada, pero le encantan los libros, las plantas y los vales de café.'],
      rsvp: ['¿Vienes a bailar?', 'Voy', 'No puedo'] },
    cita: { glyph: '♥', lead: 'Alguien quiere verte', to: 'Solo para ti', host: 'Esta noche tengo una invitación para ti:', title: 'Una cena para dos',
      msg: 'Mesa con velas, buena música y tú. Solo falta que digas que sí.', date: '2027-02-13T20:00', place: 'Terraza El Mirador, Manta', mapq: 'Manta, Manabí, Ecuador', orn: 'corazon',
      fx: 'corazones', chime: [392, 493.88, 587.33, 783.99],
      it: [['20:00', 'Nos vemos en la terraza'], ['20:30', 'Cena a la luz de las velas'], ['22:00', 'Postre y un baile lento'], ['23:00', 'Paseo bajo las estrellas']],
      dress: ['Elegante casual, en tonos vino o negro.', ['#8c1d40', '#e8b4a0', '#2a0f2e']],
      menu: [['Entrada', 'Carpaccio de res'], ['Fuerte', 'Pasta fresca con camarones'], ['Postre', 'Fondant de chocolate para compartir']],
      extra: ['gi', 'Una sola regla', 'No traigas nada. Solo trae tu mejor sonrisa y tu historia favorita.'],
      rsvp: ['¿Aceptas mi invitación?', 'Sí, acepto', 'Otro día'] }
  };
  var DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var cur = 'navidad', tick = null, rsvp = { ans: null, n: 1 }, soundOn = true, dodges = 0;

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
  function burst(el) {
    if (reduce) return; var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var kind = T[cur].fx; var pk = kind === 'nieve' ? 'confeti' : kind;
    for (var i = 0; i < 110; i++) P.push(mk(pk === 'confeti' || kind === 'nieve' ? 'confeti' : kind, true, x, y));
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); } else if (!reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } });

  /* ---------- sonido (campanita) ---------- */
  var AC = null;
  function chime() {
    if (!soundOn) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
      T[cur].chime.forEach(function (f, i) {
        var o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + i * .13;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.16, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + 1.3);
        o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 1.4);
      });
    } catch (e) {}
  }
  $('snd').addEventListener('click', function () { soundOn = !soundOn; this.setAttribute('aria-pressed', String(soundOn)); this.textContent = soundOn ? '🔔' : '🔕'; this.setAttribute('aria-label', soundOn ? 'Sonido activado' : 'Sonido apagado'); if (soundOn) chime(); });

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
  function buildTiles(t) {
    var it = '<ol class="timeline">' + t.it.map(function (x, i) { return '<li style="--i:' + i + '"><b>' + esc(x[0]) + ' h</b>' + esc(x[1]) + '</li>'; }).join('') + '</ol>';
    var dr = '<p>' + esc(t.dress[0]) + '</p><div class="swatches">' + t.dress[1].map(function (c, i) { return '<i style="background:' + c + ';--i:' + i + '"></i>'; }).join('') + '</div><small>Estos son los colores del evento.</small>';
    var me = '<ul class="menu-list">' + t.menu.map(function (m) { return '<li><span>' + esc(m[0]) + '</span><span>' + esc(m[1]) + '</span></li>'; }).join('') + '</ul><small>Avísanos si tienes alguna alergia al confirmar.</small>';
    var pl = '<p><b>' + esc(t.place) + '</b></p><p><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t.place + ', ' + t.mapq) + '">Abrir en Google Maps</a></p><small>Hay parqueadero cerca. Si vienes en taxi, llega 10 minutos antes para ubicarte con calma.</small>';
    var ex = '<p>' + esc(t.extra[2]) + '</p>';
    $('tiles').innerHTML = tile('it', 'it', 'Itinerario', it) + tile('dr', 'dr', 'Vestimenta', dr) + tile('me', 'me', 'Menú', me) + tile('pl', 'pl', 'Lugar', pl) + tile('ex', t.extra[0], t.extra[1], ex);
  }
  function setTheme(k) {
    cur = k; var t = T[k], d = parse(t.date);
    document.body.setAttribute('data-theme', k);
    document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.body).getPropertyValue('--table').trim() || '#08190f';
    document.querySelectorAll('#themes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === k)); });
    $('glyph-a').textContent = $('glyph-b').textContent = t.glyph;
    $('lead-big').textContent = t.lead; $('to-line').textContent = t.to;
    $('c-host').textContent = t.host; $('c-title').innerHTML = titleChars(t.title); $('c-title').setAttribute('aria-label', t.title); $('c-msg').textContent = t.msg;
    $('c-dow').textContent = DOW[d.getDay()]; $('c-num').textContent = d.getDate(); $('c-mon').textContent = MON[d.getMonth()];
    $('c-time').textContent = d.getHours() + ':' + pad(d.getMinutes()) + ' h'; $('c-year').textContent = d.getFullYear();
    $('map').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t.place + ', ' + t.mapq);
    $('wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Poseidón 👋 Vi la invitación interactiva de «' + t.title + '» y quiero una para mi evento.');
    $('r-title').textContent = t.rsvp[0]; $('yes').textContent = t.rsvp[1]; $('no').textContent = t.rsvp[2];
    drawOrn(k); buildTiles(t); resetRsvp(); closeEnvelope(); startCount();
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
      $('card').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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

  /* acordeón */
  $('tiles').addEventListener('click', function (e) {
    var b = e.target.closest('.tile > button'); if (!b) return;
    var tl = b.parentNode, open = !tl.classList.contains('open');
    tl.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(function () { tl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); }, 300);
  });

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
    $('guests').hidden = true; $('note-in').hidden = true; $('dodge').hidden = true; $('g-n').textContent = '1'; $('note').value = ''; $('send').disabled = true; $('send').hidden = false; $('done').hidden = true;
  }
  function pick(a) {
    rsvp.ans = a; $('yes').setAttribute('aria-pressed', String(a === 'si')); $('no').setAttribute('aria-pressed', String(a === 'no'));
    $('guests').hidden = a !== 'si'; $('note-in').hidden = false; $('send').disabled = false;
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
    $('send').hidden = true; var d = $('done'); d.hidden = false; var note = $('note').value.trim();
    d.textContent = (rsvp.ans === 'si' ? '¡Listo! Contamos con ' + rsvp.n + (rsvp.n === 1 ? ' persona.' : ' personas.') : 'Gracias por avisar. Te vamos a extrañar.') + (note ? ' Anotamos: «' + note + '».' : '') +
      ' (Ejemplo: en tu invitación, esta respuesta le llega al anfitrión por WhatsApp.)';
    if (rsvp.ans === 'si') burst(d);
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

  var q = new URLSearchParams(location.search).get('t');
  setTheme(T[q] ? q : 'navidad');
})();
