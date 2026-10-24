const fs = require('fs');
const path = require('path');
const db = require('./connection');

// 이미 배포된 DB 에 나중에 생긴 컬럼을 붙인다. schema.sql 에 컬럼을 더하면 여기에도 같이 적는다.
// (SQLite 의 ALTER TABLE ADD COLUMN 에는 UNIQUE 를 못 건다 — 필요하면 부분 유니크 인덱스로.)
const MISSING_COLUMNS = {
  inquiries: [],
};

function addMissingColumns() {
  for (const [table, columns] of Object.entries(MISSING_COLUMNS)) {
    const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [name, type] of columns) {
      if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
  }
}

function migrate() {
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  addMissingColumns();
}

module.exports = { migrate };
