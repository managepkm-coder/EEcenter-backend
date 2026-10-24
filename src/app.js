const path = require('path');
const express = require('express');

const env = require('./config/env');
const { PAGES, byPath } = require('./pages');
const { renderPage, esc } = require('./render');
const site = require('./content/site');
const inquiryRoutes = require('./routes/inquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 이 앱은 언제나 nginx 뒤에서 돈다. 앞단 한 대만 믿어서, 방문자가 헤더를 지어 보내도
// nginx 가 덧붙인 실제 주소로 접수 횟수를 센다.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use(express.json({ limit: '20kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/inquiries', inquiryRoutes);
app.use(adminRoutes);

// 그림 · CSS · 스크립트. 화면 파일(src/views)은 여기서 그대로 내보내지 않고 아래에서 조립한다.
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets'), {
  maxAge: env.nodeEnv === 'production' ? '7d' : 0,
}));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${env.siteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const urls = PAGES.map((p) => `  <url><loc>${esc(env.siteUrl + p.path)}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  // 끝에 / 가 붙은 주소는 하나로 모은다 — 같은 화면이 두 주소로 검색엔진에 잡히지 않게.
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const q = req.originalUrl.slice(req.path.length);
    return res.redirect(301, req.path.replace(/\/+$/, '') + q);
  }
  const page = byPath.get(req.path);
  if (!page) return next();
  const ctx = { ...(page.ctx || {}) };
  // 서비스 화면에서 '견적 문의' 를 누르고 오면 그 서비스를 미리 골라 둔다. 아는 값만 받는다.
  if (page.form && typeof req.query.service === 'string') {
    const known = site.services.some((s) => s.slug === req.query.service) || req.query.service === 'conversion';
    if (known) ctx.preselect = req.query.service;
  }
  res.type('html').send(renderPage({ view: page.view, pathname: page.path, ctx, meta: page.meta }));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: '찾을 수 없는 요청입니다.' });
  res.status(404).type('html').send(renderPage({ view: '404', pathname: req.path }));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // 본문이 JSON 이 아니거나 너무 크면 express.json 이 여기로 보낸다.
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ message: '보낸 내용을 읽을 수 없습니다.' });
  }
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ message: '잠시 후 다시 시도해주세요.' });
  res.status(500).type('text').send('잠시 후 다시 시도해주세요.');
});

module.exports = app;
