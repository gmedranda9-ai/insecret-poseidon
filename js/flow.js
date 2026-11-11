(function () {
  var pks = document.querySelectorAll('.pk-list .pk'), timers = {};
  function show(pk, n) {
    var st = pk.querySelectorAll('.fs'), im = pk.querySelectorAll('.flow-phone img');
    st.forEach(function (x, k) { x.classList.toggle('on', k === n); });
    im.forEach(function (x, k) { if (x.dataset.src) { x.src = x.dataset.src; x.removeAttribute('data-src'); } x.classList.toggle('on', k === n); });
    pk.dataset.i = n;
  }
  function auto(pk) {
    clearInterval(timers[pk.dataset.k]);
    if (!pk.classList.contains('on')) return;
    var total = pk.querySelectorAll('.fs').length;
    timers[pk.dataset.k] = setInterval(function () { show(pk, ((+pk.dataset.i || 0) + 1) % total); }, 4500);
  }
  function open(pk) {
    pks.forEach(function (o) { var on = o === pk; o.classList.toggle('on', on); o.querySelector('.pk-h').setAttribute('aria-expanded', on); if (!on) clearInterval(timers[o.dataset.k]); });
    show(pk, 0); auto(pk);
  }
  pks.forEach(function (pk) {
    pk.querySelector('.pk-h').addEventListener('click', function () { if (pk.classList.contains('on')) { pk.classList.remove('on'); pk.querySelector('.pk-h').setAttribute('aria-expanded', 'false'); clearInterval(timers[pk.dataset.k]); } else open(pk); });
    pk.querySelectorAll('.fs').forEach(function (b) { b.addEventListener('click', function () { show(pk, +b.dataset.i); auto(pk); }); });
  });
  open(pks[0]);
})();
