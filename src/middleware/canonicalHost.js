// 대표 주소 하나로 모은다 — 사이트 주소(SITE_URL)가 아닌 이름으로 들어온 손님을 그 주소로 넘긴다(301).
// 도메인 셋(carup.kr · carupcenter.kr · carupcenter.com)과 www, 카페24 임시 주소(ibizinfo1.cafe24.com)가 모두 이 서버를 가리킨다(2026-11-18).
// 이름마다 같은 화면이 따로 열리면 검색엔진이 같은 글을 여러 곳에 흩어 세고, 손님이 저장한 즐겨찾기 · 공유 링크도 제각각이 된다.
// 대표 주소는 .env 의 SITE_URL 한 곳에서 온다 — 바꾸려면 그 값만 바꾸고 다시 띄운다.
//
// 넘기지 않는 것 —
//   · 서버 안에서 부르는 주소(localhost · 127.0.0.1 · IP) — /health 확인, ssh 미리 보기 연결(localhost:8300)이 여기로 온다.
//   · GET · HEAD 가 아닌 요청 — 301 을 받으면 브라우저가 보내던 접수 내용(POST)을 버리고 GET 으로 바꾼다.
//   · SITE_URL 자체가 이 PC(localhost)일 때 — 개발 중에는 모으지 않는다.
const env = require('../config/env');

const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|\d+\.\d+\.\d+\.\d+)$/;

let canonicalHost = '';
try { canonicalHost = new URL(env.siteUrl).hostname.toLowerCase(); } catch (e) { canonicalHost = ''; }

function canonicalHostRedirect(req, res, next) {
  if (!canonicalHost || LOCAL.test(canonicalHost)) return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
  if (!host || host === canonicalHost || LOCAL.test(host)) return next();
  return res.redirect(301, env.siteUrl + req.originalUrl);
}

module.exports = canonicalHostRedirect;
