const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const env = require('../config/env');

const dbPath = path.resolve(__dirname, '..', '..', env.dbPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
// 접수와 관리 화면 조회가 겹쳐도 읽는 쪽이 막히지 않게 한다.
db.exec('PRAGMA journal_mode = WAL;');

module.exports = db;
