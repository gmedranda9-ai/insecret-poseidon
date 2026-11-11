/* Paletas de color por ocasión · Poseidón InSecret (compartido: invitación, crear/editar, imagen para compartir) */
(function () {
  'use strict';
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function hex(a) { return '#' + a.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function rgba(h, a) { var x = rgb(h); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; }
  /* n nombre · tb mesa · env sobre · bg papel · ink texto · ac acento · se sello · si tinta del sello · btn/bi botón */
  var P = {
    navidad: [
      { n: 'Verde bosque', d: ['#0f3324', '#e0b04b', '#b3202f'] },
      { n: 'Rojo y oro', tb: '#2a0509', env: '#7a1220', bg: '#5c0d18', ink: '#fff3dc', ac: '#e3b857', se: '#d4a640', si: '#4a0a14' },
      { n: 'Blanco y plata', tb: '#0a1226', env: '#1f3358', bg: '#14213d', ink: '#f4f7fb', ac: '#c9d3e0', se: '#9fb3cf', si: '#14213d' },
      { n: 'Cobre y vino', tb: '#230a16', env: '#5a1b33', bg: '#4a1428', ink: '#fbefe3', ac: '#d98c5a', se: '#c97b4a', si: '#2a0d18' }
    ],
    fin: [
      { n: 'Medianoche', d: ['#0a0f2a', '#d8bd82', '#161f4d'] },
      { n: 'Champaña', tb: '#2b1d12', env: '#e9d4a5', bg: '#f7ecd2', ink: '#2b1d12', ac: '#9c6b2f', se: '#9c6b2f', si: '#fff8e7', bi: '#fff8e7' },
      { n: 'Plata y azul', tb: '#0c0e17', env: '#262c45', bg: '#1a1d29', ink: '#eef1f8', ac: '#7fa1ff', se: '#4c7dff', si: '#ffffff' },
      { n: 'Rosa dorado', tb: '#1a0b1c', env: '#4a2450', bg: '#2e1530', ink: '#fff1ec', ac: '#e8a598', se: '#e8a598', si: '#2e1530' }
    ],
    cumple: [
      { n: 'Confeti', d: ['#ff6b35', '#ffd23f', '#14185c'] },
      { n: 'Atardecer', tb: '#3a1457', env: '#d6336c', bg: '#ffb38a', ink: '#3b1450', ac: '#8a2a8c', se: '#5b2a86', si: '#ffe3cf', btn: '#5b2a86', bi: '#fff1e6', solid: 1 },
      { n: 'Fiesta neón', tb: '#120826', env: '#3a1c78', bg: '#22103d', ink: '#f6eaff', ac: '#ff4da6', se: '#ff4da6', si: '#22103d', btn: '#3de8f5', bi: '#22103d', solid: 1 },
      { n: 'Pastel', tb: '#4a3d6b', env: '#cdb8f0', bg: '#fdf1f5', ink: '#3a2f4b', ac: '#d6709a', se: '#7fcfae', si: '#1f3a2e', btn: '#3a2f4b', bi: '#fdf1f5', solid: 1 }
    ],
    cita: [
      { n: 'Rosa y vino', d: ['#27092b', '#ff8fa8', '#6b1c46'] },
      { n: 'Rojo pasión', tb: '#0c0406', env: '#8e0b22', bg: '#1a070b', ink: '#fbeee6', ac: '#e9c9a0', se: '#c8102e', si: '#ffe9e0' },
      { n: 'Atardecer dorado', tb: '#2a0f26', env: '#b8672a', bg: '#4b1d3f', ink: '#fff4e2', ac: '#f0a24a', se: '#e08a3c', si: '#3a1230' },
      { n: 'Noche de luna', tb: '#060a1c', env: '#243163', bg: '#101a3a', ink: '#eceffc', ac: '#b9a7f2', se: '#8a77e0', si: '#0e1536' }
    ]
  };
  function get(theme, i) { var l = P[theme]; i = +i; return l && i > 0 && i < l.length ? l[i] : null; }
  /* variables CSS de la invitación (null = la paleta original, sin tocar nada) */
  function vars(theme, i) {
    var p = get(theme, i); if (!p) return null;
    var env = p.env, o = {
      '--table': p.tb, '--table2': mix(p.tb, env, .5), '--env': env, '--env-d': mix(env, '#000000', .15), '--env-dd': mix(env, '#000000', .3), '--paper': p.bg,
      '--ink': p.ink, '--ink-soft': mix(p.ink, p.bg, .3), '--accent': p.ac, '--rule': rgba(p.ac, .42), '--seal': p.se, '--seal-d': mix(p.se, '#000000', .35), '--seal-ink': p.si,
      '--btn': p.btn || p.ac, '--btn-ink': p.bi || p.tb
    };
    var f = p.solid ? 'linear-gradient(' + p.ink + ',' + p.ink + ')' : 'linear-gradient(100deg,' + mix(p.ac, '#000000', .3) + ' 0%,' + mix(p.ac, '#ffffff', .35) + ' 28%,' + mix(p.ac, '#ffffff', .7) + ' 50%,' + p.ac + ' 72%,' + mix(p.ac, '#000000', .3) + ' 100%)';
    o['--foil'] = f; o['--titlebg'] = f; return o;
  }
  /* colores para la imagen de WhatsApp */
  function card(theme, i) {
    var p = get(theme, i); if (!p) return null;
    var q = rgb(p.bg), dark = (q[0] * .3 + q[1] * .59 + q[2] * .11) < 140;
    return { bg: [p.bg, dark ? mix(p.bg, p.tb, .55) : mix(p.bg, '#000000', .1)], acc: dark ? p.ac : mix(p.ac, '#000000', .3), ink: p.ink, mut: mix(p.ink, p.bg, .32), btn: p.btn || (dark ? p.ac : p.ink), btnInk: p.bi || (dark ? p.tb : p.bg), tint: p.env };
  }
  function dots(theme, i) { var l = P[theme] || [], p = l[+i] || l[0]; if (!p) return []; return p.d || [p.env, p.bg, p.ac]; }
  window.INS_PAL = { list: P, get: get, vars: vars, card: card, dots: dots, count: 4, keys: ['--table', '--table2', '--env', '--env-d', '--env-dd', '--paper', '--ink', '--ink-soft', '--accent', '--rule', '--seal', '--seal-d', '--seal-ink', '--btn', '--btn-ink', '--foil', '--titlebg'] };
})();
