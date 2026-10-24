// 시공 갤러리 — 작업별로 보기. 사례가 없으면 거를 것도 없어 단추만 바뀐다.
(function () {
  var bar = document.querySelector('.filter-bar');
  var grid = document.getElementById('galleryGrid');
  if (!bar || !grid) return;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    var want = btn.getAttribute('data-filter');
    bar.querySelectorAll('[data-filter]').forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    grid.querySelectorAll('[data-service]').forEach(function (card) {
      card.hidden = want !== 'all' && card.getAttribute('data-service') !== want;
    });
  });
})();
