const site = require('./content/site');

// 주소 → 화면 파일. 여기 적힌 주소만 화면으로 내보낸다(폴더를 훑어 자동으로 열지 않는다 —
// 만들다 만 파일이 주소로 열리지 않게). sitemap.xml 도 이 목록에서 만든다.
const PAGES = [
  { path: '/', view: 'home' },
  { path: '/about/greeting', view: 'about/greeting' },
  { path: '/about/facilities', view: 'about/facilities' },
  { path: '/about/location', view: 'about/location' },
  { path: '/services', view: 'services/index' },
  // 서비스별 화면 다섯 개는 같은 틀에 content/site.js 의 값을 채워 그린다.
  ...site.services.map((s) => ({
    path: `/services/${s.slug}`,
    view: 'services/detail',
    ctx: { service: s },
    meta: { title: s.title, heroTitle: s.title, heroDesc: s.summary, description: `${s.title} — ${s.summary}` },
  })),
  { path: '/gallery', view: 'gallery' },
  { path: '/shop', view: 'shop' },
  { path: '/support', view: 'support/index' },
  { path: '/support/inquiry', view: 'support/inquiry', form: true },
  { path: '/support/booking', view: 'support/booking', form: true },
  { path: '/privacy', view: 'privacy' },
];

const byPath = new Map(PAGES.map((p) => [p.path, p]));

module.exports = { PAGES, byPath };
