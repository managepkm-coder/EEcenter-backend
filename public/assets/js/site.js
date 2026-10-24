// 모든 화면이 쓰는 동작 — 전체메뉴 창과 맨 위로 단추.
// 단추마다 이벤트를 붙이지 않고 표시(data-open-menu 등)로 문서에서 받는다. 같은 단추가 머리말과 404 화면에 함께 있다.
(function () {
  var menu = document.getElementById('fullMenu');
  var opener = null;

  function focusables() {
    return menu.querySelectorAll('a[href], button:not([disabled])');
  }

  function openMenu(from) {
    if (!menu) return;
    opener = from || document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    var close = menu.querySelector('[data-close-menu]');
    if (close) close.focus();
  }

  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    // 연 단추로 돌아간다 — 그러지 않으면 키보드로 쓰는 사람은 문서 맨 앞에서 다시 시작한다.
    if (opener && opener.focus) opener.focus();
  }

  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-open-menu]');
    if (open) { openMenu(open); return; }
    if (e.target.closest('[data-close-menu]')) { closeMenu(); return; }
    // 창 바깥(어두운 자리)을 누르면 닫는다.
    if (menu && e.target === menu) { closeMenu(); return; }
    // 같은 화면 안의 구역(#)으로 가는 메뉴를 누르면 창을 닫아야 그 자리가 보인다.
    if (menu && !menu.hidden && e.target.closest('#fullMenu a')) closeMenu();
    if (e.target.closest('[data-top]')) {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var main = document.getElementById('main');
      if (main) main.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!menu || menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    // 창이 열려 있는 동안 Tab 이 뒤 화면으로 빠져나가지 않게 처음과 끝을 잇는다.
    if (e.key === 'Tab') {
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
