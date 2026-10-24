// 모든 화면을 그려보고 ① 채워지지 않은 표시(<!--=…--> · {{…}}) ② 안쪽 링크가 없는 화면을 가리키는지를 본다.
// 서버를 띄우지 않고 돈다 — `npm run check`.
const { PAGES, byPath } = require('../src/pages');
const { renderPage } = require('../src/render');

let bad = 0;
for (const p of PAGES) {
  const html = renderPage({ view: p.view, pathname: p.path, ctx: p.ctx, meta: p.meta });
  const left = html.match(/<!--=\w+-->|\{\{\w+\}\}/g);
  if (left) { bad++; console.log(`!! ${p.path} 채워지지 않은 표시: ${[...new Set(left)].join(' ')}`); }
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (href.startsWith('/assets/') || href === '/admin') continue;
    if (!byPath.has(href)) { bad++; console.log(`!! ${p.path} → 없는 화면 ${href}`); }
  }
}
console.log(bad ? `문제 ${bad}건` : `화면 ${PAGES.length}개 정상`);
process.exit(bad ? 1 : 0);
