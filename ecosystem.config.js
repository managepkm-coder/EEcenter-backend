// PM2 설정 — 서버 폴더에서 `pm2 start ecosystem.config.js` 로 띄운다.
// 값(포트 · 비밀번호)은 .env 에 둔다. 여기에 적으면 저장소에 비밀번호가 남는다.
module.exports = {
  apps: [
    {
      name: 'ee-upbattery',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,          // SQLite 파일 하나를 쓰므로 한 프로세스로 돈다
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
