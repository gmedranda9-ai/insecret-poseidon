/* Todo botón de WhatsApp hacia Afrodita abre antes una ventanita con un campo de texto:
   la persona cuenta qué necesita y Afrodita recibe el contexto (de qué página viene y qué escribió). */
(function () {
  'use strict';
  var NUM = '593968520688', dlg = null;
  var CTX = [[/^\/empresas/, 'InSecret · Empresas'], [/^\/crear|^\/pedido|^\/editar/, 'InSecret · Invitación personal'], [/^\/invitaciones?\//, 'InSecret · Invitaciones'], [/^\/amigo-secreto/, 'InSecret · Amigo secreto']];
  function ctxName(a) { if (a.dataset.ctx) return a.dataset.ctx; var p = location.pathname.replace(/^\/insecret-poseidon/, ''); for (var i = 0; i < CTX.length; i++) if (CTX[i][0].test(p)) return CTX[i][1]; return 'InSecret'; }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; }
  function build() {
    var ov = el('div', 'afro-ov'); ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'afro-t');
    var bx = el('div', 'afro-bx');
    var t = el('h3', '', 'Cuéntale a Afrodita qué necesitas'); t.id = 'afro-t';
    var p = el('p', 'afro-p', 'Afrodita es la asistente de Poseidón: te atiende por WhatsApp y, si hace falta, te pasa con una persona del equipo.');
    var chip = el('span', 'afro-chip'); chip.id = 'afro-chip';
    var ta = el('textarea', 'afro-ta'); ta.id = 'afro-ta'; ta.maxLength = 500; ta.rows = 5;
    var hint = el('small', 'afro-h', 'Puedes cambiar el texto. Mientras más detalle, más rápido te ayuda.');
    var go = el('a', 'afro-go', 'Abrir WhatsApp con Afrodita'); go.id = 'afro-go'; go.target = '_blank'; go.rel = 'noopener noreferrer';
    var cl = el('button', 'afro-x', 'Cancelar'); cl.type = 'button';
    bx.appendChild(t); bx.appendChild(p); bx.appendChild(chip); bx.appendChild(ta); bx.appendChild(hint); bx.appendChild(go); bx.appendChild(cl); ov.appendChild(bx); document.body.appendChild(ov);
    function close() { ov.hidden = true; document.body.classList.remove('afro-open'); }
    cl.onclick = close; ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) close(); });
    function upd() { go.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent('Hola Afrodita 👋 [' + chip.textContent + '] ' + ta.value.trim()); }
    ta.addEventListener('input', upd); go.addEventListener('click', function () { setTimeout(close, 300); });
    dlg = { ov: ov, ta: ta, chip: chip, upd: upd };
  }
  function open(a) {
    if (!dlg) build();
    var txt = ''; try { txt = new URL(a.href).searchParams.get('text') || ''; } catch (e) {}
    txt = txt.replace(/^Hola\s+(Afrodita|Poseid[oó]n)\s*👋?\s*/i, '');
    dlg.chip.textContent = ctxName(a); dlg.ta.value = txt; dlg.upd(); dlg.ov.hidden = false; document.body.classList.add('afro-open');
    setTimeout(function () { dlg.ta.focus(); dlg.ta.setSelectionRange(dlg.ta.value.length, dlg.ta.value.length); }, 60);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.id === 'afro-go') return;
    if (a.href.indexOf('https://wa.me/' + NUM) !== 0) return;
    e.preventDefault(); open(a);
  }, true);
})();
