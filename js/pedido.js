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
