// 오프라인 미리보기 — 모든 화면을 HTML 파일로 떠서, 서버 없이 index.html 을 두 번 눌러 볼 수 있게 한다.
//   npm run export -- <내보낼 폴더>      (기본: ./offline)
// 화면은 서버가 머리말 · 바닥글을 끼워 조립하므로 src/views 의 파일을 그대로 열면 메뉴가 비어 보인다.
// 여기서 서버와 같은 함수(renderPage)로 그려 주소만 상대 경로로 바꾼다 — 글을 두 벌로 두지 않는다.
// Bootstrap · 아이콘도 함께 복사해 인터넷 없이 열린다(글꼴은 PC 의 맑은 고딕으로 대신 그린다).
// 문의 · 예약 접수는 서버가 있어야 저장되므로 미리보기에서는 동작하지 않는다(화면 위에 그 사정을 적는다).
const fs = require('fs');
const path = require('path');
const { PAGES } = require('../src/pages');
const { renderPage } = require('../src/render');

const ROOT = path.join(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'offline'));

const fileOf = (p) => (p === '/' ? 'index.html' : `${p.slice(1)}.html`);
const known = new Map(PAGES.map((p) => [p.path, fileOf(p.path)]));

function rel(fromFile, target) {
  const r = path.posix.relative(path.posix.dirname(fromFile), target);
  return r || path.posix.basename(target);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 그림 · CSS · 스크립트
fs.cpSync(path.join(ROOT, 'public', 'assets'), path.join(out, 'assets'), { recursive: true });
const cssPath = path.join(out, 'assets', 'css', 'site.css');
fs.writeFileSync(cssPath, fs.readFileSync(cssPath, 'utf8').replace(/url\('\/assets\//g, "url('../"));

const vendor = path.join(out, 'assets', 'vendor');
fs.mkdirSync(vendor, { recursive: true });
const nm = path.join(ROOT, 'node_modules');
fs.copyFileSync(path.join(nm, 'bootstrap', 'dist', 'css', 'bootstrap.min.css'), path.join(vendor, 'bootstrap.min.css'));
fs.copyFileSync(path.join(nm, 'bootstrap-icons', 'font', 'bootstrap-icons.min.css'), path.join(vendor, 'bootstrap-icons.min.css'));
fs.cpSync(path.join(nm, 'bootstrap-icons', 'font', 'fonts'), path.join(vendor, 'fonts'), { recursive: true });

const NOTE = '<div style="background:#fff3cd;color:#664d03;border-bottom:1px solid #ffe69c;padding:8px 14px;font-size:14px;text-align:center">'
  + '오프라인 미리보기입니다 — 견적 · 예약 접수는 서버에 올린 뒤에 동작합니다.</div>';

for (const p of PAGES) {
  const file = fileOf(p.path);
  let html = renderPage({ view: p.view, pathname: p.path, ctx: p.ctx, meta: p.meta });

  html = html
    .replace(/<link rel="(preconnect|canonical)"[^>]*>\s*/g, '')
    .replace(/<meta property="og:url"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
    .replace('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', '/assets/vendor/bootstrap.min.css')
    .replace('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css', '/assets/vendor/bootstrap-icons.min.css')
    .replace('<body>', `<body>\n  ${NOTE}`);

  // 사이트 안 주소(/…)를 이 파일에서 본 상대 경로로. 쿼리(?service=)는 서버가 읽는 값이라 뗀다.
  html = html.replace(/(href|src)="\/([^"]*)"/g, (all, attr, rest) => {
    const [beforeHash, hash] = rest.split('#');
    const pathPart = '/' + beforeHash.split('?')[0];
    let target;
    if (pathPart.startsWith('/assets/')) target = pathPart.slice(1);
    else if (known.has(pathPart)) target = known.get(pathPart);
    else return `${attr}="#"`;   // 관리 화면처럼 서버에만 있는 주소
    return `${attr}="${rel(file, target)}${hash ? '#' + hash : ''}"`;
  });

  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

console.log(`화면 ${PAGES.length}개를 ${out} 에 내보냈습니다. index.html 을 여세요.`);
