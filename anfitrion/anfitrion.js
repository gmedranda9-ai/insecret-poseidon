(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, C = window.INSECRET_CONFIG || {};
  var H = new URLSearchParams(location.search).get('h') || '', D = null;
  function toast(m) { var t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2000); }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Copiado'); }, function () { toast('Selecciónalo y cópialo a mano'); }); }
  function bad() { $('loading').hidden = true; $('bad').hidden = false; }
  function load() {
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(H)) return bad();
    fetch(C.supabaseUrl + '/rest/v1/rpc/host_get', { method: 'POST', headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_host_token: H }) })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (!d || d.message || d.error) return bad(); D = d; render(); }, bad);
  }
  function render() {
    $('loading').hidden = true; $('ok').hidden = false;
    $('h-title').textContent = D.title || 'Tu invitación';
    try { $('h-when').textContent = new Date(D.event_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'full', timeStyle: 'short' }); } catch (e) {}
    $('h-off').hidden = !!D.active;
    var rs = D.rsvps || [], yes = 0, no = 0, box = $('rs'); box.innerHTML = '';
    rs.forEach(function (r) {
      if (r.answer === 'si') yes += r.guests || 1; else no++;
      var d = document.createElement('div'); d.className = 'r' + (r.answer === 'si' ? '' : ' no');
      var b = document.createElement('b'); b.textContent = r.name; var t = document.createElement('span'); t.className = 'tag' + (r.answer === 'si' ? '' : ' no'); t.textContent = r.answer === 'si' ? (r.guests > 1 ? 'Va · ' + r.guests + ' personas' : 'Va') : 'No puede'; b.appendChild(t); d.appendChild(b);
      if (r.note) { var s = document.createElement('small'); s.textContent = '“' + r.note + '”'; d.appendChild(s); }
      box.appendChild(d);
    });
    $('rs-empty').hidden = !!rs.length; $('s-yes').textContent = yes; $('s-no').textContent = no; $('s-n').textContent = rs.length;
    $('inv').value = location.origin + '/invitacion/?i=' + D.slug;
  }
  $('reload').onclick = load;
  $('cp-inv').onclick = function () { copy($('inv').value); };
  $('share').onclick = function () {
    var rs = D.rsvps || [], lines = ['Resumen «' + D.title + '»:'];
    rs.forEach(function (r) { lines.push('• ' + r.name + ': ' + (r.answer === 'si' ? 'va (' + (r.guests || 1) + ')' : 'no puede') + (r.note ? ' — ' + r.note : '')); });
    lines.push('Total asistentes: ' + $('s-yes').textContent);
    window.open('https://wa.me/?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  };
  $('gen').onclick = function () {
    var out = $('names').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (n) { return n + ': ' + $('inv').value + '&para=' + encodeURIComponent(n); });
    $('links').value = out.join('\n'); $('links').hidden = $('cp-links').hidden = !out.length;
  };
  $('cp-links').onclick = function () { copy($('links').value); };
  load();
})();
