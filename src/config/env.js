require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env'), quiet: true });

const env = {
  port: Number(process.env.PORT) || 3300,
  // 서버 안에서만 받는다 — nginx 를 건너뛰어 HTTPS 없이 들어오거나, X-Forwarded-For 를 지어 보내
  // IP 기준 접수 제한을 피하는 길을 막는다(캠카 서버와 같은 판단). 이름을 HOST 로 두지 않는 이유는
  // 셸이 HOST 에 컴퓨터 이름을 넣어두는 경우가 있고 dotenv 는 이미 있는 값을 덮지 않기 때문이다.
  host: process.env.LISTEN_HOST || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'development',
  siteUrl: (process.env.SITE_URL || 'http://localhost:3300').replace(/\/+$/, ''),
  dbPath: process.env.DB_PATH || './data/upgrade.db',
  admin: {
    user: process.env.ADMIN_USER || 'admin',
    // 비어 있으면 관리 화면 자체를 닫는다. 기본 비밀번호를 두면 그것이 곧 인터넷에 열린 문이 된다.
    password: process.env.ADMIN_PASSWORD || '',
  },
};

module.exports = env;
