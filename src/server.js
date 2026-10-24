const app = require('./app');
const env = require('./config/env');
const { migrate } = require('./db/migrate');

migrate();

app.listen(env.port, env.host, () => {
  console.log(`EE upgrade center server listening on http://${env.host}:${env.port}`);
  if (!env.admin.password) console.log('[admin] ADMIN_PASSWORD 가 비어 있어 /admin 이 닫혀 있습니다.');
});
