/* Invitación interactiva de ejemplo · Poseidón */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var WA = '593982354338';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var T = {
    navidad: { glyph: 'N', to: 'Familia y amigos', host: 'La familia Andrade te invita a la', title: 'Cena de Navidad',
      msg: 'Una noche para brindar, comer rico y estar juntos.', date: '2026-12-24T20:00', place: 'Casa de los Andrade, Pedernales',
      dress: 'Rojo, verde o dorado', note: 'Habrá intercambio de amigo secreto.', mapq: 'Pedernales, Manabí, Ecuador', orn: 'pino' },
    fin: { glyph: '27', to: 'Para ti y tu acompañante', host: 'Despide el año con nosotros en la', title: 'Noche de fin de año',
      msg: 'Brindamos por lo vivido y recibimos el 2027 a medianoche.', date: '2026-12-31T21:00', place: 'Terraza del Mar, Manta',
      dress: 'Blanco y dorado', note: 'El brindis es a las 00:00 en punto.', mapq: 'Manta, Manabí, Ecuador', orn: 'burbujas', target: '2027-01-01T00:00' },
    aniversario: { glyph: '&', to: 'Con cariño', host: 'Marta y Luis celebran con ustedes sus', title: '25 años juntos',
      msg: 'Renovamos votos y brindamos con quienes nos han acompañado.', date: '2027-02-20T19:00', place: 'Jardín Los Cocos, Portoviejo',
      dress: 'Elegante, en tonos pastel', note: 'Ceremonia a las 19:00, cena a las 20:00.', mapq: 'Portoviejo, Manabí, Ecuador', orn: 'anillos' },
    cumple: { glyph: '30', to: 'Para mis favoritos', host: 'Daniela te invita a su fiesta de', title: 'Daniela cumple 30',
      msg: 'Piscina, música y pastel. Ven con ganas de bailar.', date: '2027-01-16T16:00', place: 'Quinta Las Palmas, Pedernales',
      dress: 'Ropa fresca y traje de baño', note: 'Confirma antes del 9 de enero.', mapq: 'Pedernales, Manabí, Ecuador', orn: 'confeti' }
  };
  var DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var cur = 'navidad', tick = null, rsvp = { ans: null, n: 1 };

  /* ---- adornos (SVG generados) ---- */
  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  var ORN = {
    pino: function () {
      var o = '<g stroke="url(#fg)" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M40 62H280"/>';
      for (var i = 0; i < 9; i++) { var x = 78 + i * 20.5, up = 26 - Math.abs(4 - i) * 2.2;
        o += '<path d="M' + x + ' 62 q-5 -' + up * .6 + ' -13 -' + up + '"/><path d="M' + x + ' 62 q5 -' + up * .6 + ' 13 -' + up + '"/>'; }
      return o + '</g><g fill="#b3202f"><circle cx="160" cy="58" r="6"/><circle cx="146" cy="64" r="4.5"/><circle cx="174" cy="64" r="4.5"/></g>';
    },
    burbujas: function () {
      var r = seeded(7), o = '<g fill="none" stroke="url(#fg)" stroke-width="1.6">';
      for (var i = 0; i < 22; i++) o += '<circle cx="' + (30 + r() * 260).toFixed(1) + '" cy="' + (12 + r() * 66).toFixed(1) + '" r="' + (2 + r() * 6).toFixed(1) + '"/>';
      return o + '</g><path d="M160 22l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="url(#fg)"/>';
    },
    anillos: function () {
      return '<g fill="none" stroke="url(#fg)" stroke-width="3"><circle cx="143" cy="52" r="27"/><circle cx="177" cy="52" r="27"/></g><path d="M160 12l6 9-6 9-6-9z" fill="url(#fg)"/>';
    },
    confeti: function () {
      var r = seeded(11), col = ['#ff4f9a', '#1620b8', '#ff6b35', '#14185c'], o = '';
      for (var i = 0; i < 26; i++) {
        var x = (14 + r() * 292).toFixed(1), y = (8 + r() * 70).toFixed(1), c = col[i % 4], a = (r() * 180).toFixed(0);
        o += i % 3 ? '<rect x="' + x + '" y="' + y + '" width="9" height="4.5" rx="1.5" fill="' + c + '" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>'
                   : '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="' + c + '"/>';
      }
      return o;
    }
  };
  var FOIL = { navidad: ['#b8862b', '#fff0c0', '#d9ab4a'], fin: ['#b99b62', '#fff9e6', '#d3b87c'], aniversario: ['#a65a66', '#f9ddd3', '#b76e79'], cumple: ['#14185c', '#14185c', '#14185c'] };
  function drawOrn(k) {
    var f = FOIL[k];
    $('orn').innerHTML = '<defs><linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="' + f[0] + '"/><stop offset=".5" stop-color="' + f[1] + '"/><stop offset="1" stop-color="' + f[2] + '"/></linearGradient></defs>' + ORN[T[k].orn]();
  }

  /* ---- tema ---- */
  function parse(s) { var p = s.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); return new Date(+p[1], p[2] - 1, +p[3], +p[4], +p[5]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function setTheme(k) {
    cur = k; var t = T[k], d = parse(t.date);
    document.body.setAttribute('data-theme', k);
    document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.body).getPropertyValue('--table').trim() || '#08190f';
    document.querySelectorAll('#themes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === k)); });
    $('glyph-a').textContent = $('glyph-b').textContent = t.glyph;
    $('to-line').textContent = t.to;
    $('c-host').textContent = t.host; $('c-title').textContent = t.title; $('c-msg').textContent = t.msg;
    $('c-dow').textContent = DOW[d.getDay()]; $('c-num').textContent = d.getDate(); $('c-mon').textContent = MON[d.getMonth()];
    $('c-time').textContent = d.getHours() + ':' + pad(d.getMinutes()) + ' h'; $('c-year').textContent = d.getFullYear();
    $('c-place').textContent = t.place; $('c-dress').textContent = t.dress; $('c-note').textContent = t.note;
    $('map').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t.place + ', ' + t.mapq);
    $('wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Poseidón 👋 Vi la invitación interactiva de ' + t.title + ' y quiero una para mi evento.');
    drawOrn(k); resetRsvp(); closeEnvelope(); startCount();
  }

  /* ---- sobre ---- */
  function closeEnvelope() {
    $('card').hidden = true; $('scene-env').classList.remove('gone'); $('env').classList.remove('open');
    $('seal').classList.remove('broken'); $('hint').hidden = false; $('again').hidden = true;
  }
  function openEnvelope() {
    var seal = $('seal'); if (seal.classList.contains('broken')) return;
    seal.classList.add('broken'); $('hint').hidden = true;
    var step = reduce ? 0 : 1;
    setTimeout(function () { $('env').classList.add('open'); }, 380 * step);
    setTimeout(function () {
      $('scene-env').classList.add('gone'); $('card').hidden = false; $('again').hidden = false;
      var h = $('c-title'); h.tabIndex = -1; $('card').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 1750 * step);
  }
  $('seal').addEventListener('click', openEnvelope);
  $('again').addEventListener('click', function () { closeEnvelope(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  document.querySelectorAll('#themes button').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.t); }); });

  /* ---- cuenta regresiva ---- */
  function startCount() {
    clearInterval(tick); var t = T[cur], end = parse(t.target || t.date);
    function paint() {
      var s = Math.max(0, Math.floor((end - new Date()) / 1000));
      $('k-d').textContent = pad(Math.floor(s / 86400)); $('k-h').textContent = pad(Math.floor(s % 86400 / 3600));
      $('k-m').textContent = pad(Math.floor(s % 3600 / 60)); $('k-s').textContent = pad(s % 60);
    }
    paint(); tick = setInterval(paint, 1000);
  }

  /* ---- confirmación (demo: no se envía a ningún lado) ---- */
  function resetRsvp() {
    rsvp = { ans: null, n: 1 }; $('yes').setAttribute('aria-pressed', 'false'); $('no').setAttribute('aria-pressed', 'false');
    $('guests').hidden = true; $('g-n').textContent = '1'; $('send').disabled = true; $('send').hidden = false; $('done').hidden = true;
  }
  function pick(a) {
    rsvp.ans = a; $('yes').setAttribute('aria-pressed', String(a === 'si')); $('no').setAttribute('aria-pressed', String(a === 'no'));
    $('guests').hidden = a !== 'si'; $('send').disabled = false;
  }
  $('yes').addEventListener('click', function () { pick('si'); });
  $('no').addEventListener('click', function () { pick('no'); });
  $('g-minus').addEventListener('click', function () { rsvp.n = Math.max(1, rsvp.n - 1); $('g-n').textContent = rsvp.n; });
  $('g-plus').addEventListener('click', function () { rsvp.n = Math.min(10, rsvp.n + 1); $('g-n').textContent = rsvp.n; });
  $('send').addEventListener('click', function () {
    $('send').hidden = true; var d = $('done'); d.hidden = false;
    d.textContent = (rsvp.ans === 'si' ? '¡Listo! Contamos con ' + rsvp.n + (rsvp.n === 1 ? ' persona.' : ' personas.') : 'Gracias por avisar. Te vamos a extrañar.') +
      ' (Ejemplo: en tu invitación, esta respuesta le llega al anfitrión por WhatsApp.)';
  });

  /* ---- calendario .ics ---- */
  $('ics').addEventListener('click', function () {
    var t = T[cur], d = parse(t.date), e = new Date(d.getTime() + 4 * 3600e3);
    function f(x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + 'T' + pad(x.getHours()) + pad(x.getMinutes()) + '00'; }
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Poseidon//Invitacion//ES', 'BEGIN:VEVENT', 'UID:' + cur + '-' + f(d) + '@poseidonmk.com',
      'DTSTAMP:' + f(new Date()) , 'DTSTART;TZID=America/Guayaquil:' + f(d), 'DTEND;TZID=America/Guayaquil:' + f(e), 'SUMMARY:' + t.title,
      'LOCATION:' + t.place, 'DESCRIPTION:' + t.msg, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'invitacion.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  });

  var q = new URLSearchParams(location.search).get('t');
  setTheme(T[q] ? q : 'navidad');
})();
