const crypto = require('crypto');
const env = require('../config/env');

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// 관리 화면은 문의 목록 하나뿐이라 회원 · 세션을 두지 않고 HTTP 기본 인증(.env 의 아이디 · 비밀번호)으로 막는다.
// 반드시 HTTPS(nginx) 뒤에서 쓴다 — 기본 인증은 비밀번호를 암호화하지 않고 실어 보낸다.
// 비밀번호를 정하지 않았으면 그 문이 있다는 것도 알리지 않는다(404).
function requireAdmin(req, res, next) {
  if (!env.admin.password) {
    return req.originalUrl.startsWith('/api/') ? res.status(404).json({ message: '찾을 수 없는 요청입니다.' }) : res.status(404).send('Not Found');
  }
  const header = req.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const i = decoded.indexOf(':');
    if (i > 0 && same(decoded.slice(0, i), env.admin.user) && same(decoded.slice(i + 1), env.admin.password)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="EE Up Battery Admin", charset="UTF-8"');
  return res.status(401).send('로그인이 필요합니다.');
}

module.exports = requireAdmin;
