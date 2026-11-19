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

// 설명을 돕는 움직임(2026-11-18). 숨기는 규칙은 html.js-anim 아래에만 있고, 그 표시는 <head> 의 한 줄이
// '움직임 줄이기' 를 켜지 않은 화면에만 붙인다. 여기서는 화면에 들어온 칸에 is-in 을 붙여 떠오르게 할 뿐이다.
(function () {
  var root = document.documentElement;
  window.ccAnimReady = true;   // <head> 의 안전장치 — 이 스크립트가 늦거나 못 돌면 그쪽이 js-anim 을 떼어 모든 칸을 보인다.
  if (!root.classList.contains('js-anim')) return;
  if (!('IntersectionObserver' in window)) { root.classList.remove('js-anim'); return; }

  // site.css 의 숨기는 규칙과 같은 목록이다 — 한쪽에만 더하면 그 칸은 숨은 채 나오지 않거나 움직이지 않는다.
  var SEL = '.section-head, .service-card, .service-row, .steps .step, .detail-item, .facility-card, .info-card, .map-box, ' +
            '.faq-item, .home-band, .home-consult .container, .home-closing h2, .aside-card, .part-card, .greeting-text, .flow-node, .cap-box, .flow-head';
  // 차례가 뜻인 목록(구조변경 단계 · 전기 흐름)은 천천히, 나머지는 살짝만 어긋나게 띄운다.
  var SLOW = '.steps .step, .flow-node';

  function reveal(el) {
    var delay = parseFloat(el.getAttribute('data-rv-delay') || '0');
    el.classList.add('is-revealing');
    void el.offsetWidth;   // 숨은 상태를 한 번 그려 둬야 transition 이 시작된다
    el.classList.add('is-in');
    setTimeout(function () { el.classList.remove('is-revealing'); }, (delay + 0.75) * 1000);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      reveal(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  Array.prototype.forEach.call(document.querySelectorAll(SEL), function (el) {
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(SEL); });
    var i = sibs.indexOf(el);
    var step = el.matches(SLOW) ? 0.16 : 0.08;
    var delay = Math.min(i, 8) * step;
    el.setAttribute('data-rv-delay', String(delay));
    el.style.setProperty('--rv-delay', delay + 's');
    io.observe(el);
  });
  // 단계를 잇는 선 · 용량 막대는 목록 전체가 들어올 때 한 번에 그린다.
  Array.prototype.forEach.call(document.querySelectorAll('.steps'), function (el) { io.observe(el); });
})();

// 전기가 흐르는 길 — '주행 충전기 없이 연결하면?' 을 누르면 충전기를 뺀 그림으로 바꿔 왜 필요한지 보인다.
(function () {
  var TEXT = {
    on: { btn: '주행 충전기 없이 연결하면?', cap: '주행 충전기가 알터네이터의 오르내리는 전압을 리튬 배터리에 맞게 바꿔 넣어 줍니다.' },
    off: { btn: '주행 충전기를 달면?', cap: '주행 충전기가 없으면 알터네이터의 오르내리는 전압(8~16V)이 그대로 리튬 배터리에 들어가 BMS(배터리 보호회로)가 손상되고, 고장의 원인이 됩니다.' },
  };
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-flow-toggle]');
    if (!btn) return;
    var box = btn.closest('[data-flow]');
    var direct = !box.classList.contains('is-direct');
    box.classList.toggle('is-direct', direct);
    btn.setAttribute('aria-pressed', direct ? 'true' : 'false');
    var t = direct ? TEXT.off : TEXT.on;
    btn.textContent = t.btn;
    var cap = box.querySelector('[data-flow-caption]');
    if (cap) cap.textContent = t.cap;
  });
})();
