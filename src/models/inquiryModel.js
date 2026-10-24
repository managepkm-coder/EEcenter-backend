const db = require('../db/connection');

const KIND_LABEL = { quote: '견적 · 상담 문의', booking: '작업 예약 신청' };

function toPublic(row) {
  if (!row) return null;
  let services = [];
  try { services = JSON.parse(row.services || '[]'); } catch { services = []; }
  return {
    id: row.id,
    kind: row.kind,
    kindLabel: KIND_LABEL[row.kind] || row.kind,
    name: row.name,
    phone: row.phone,
    vehicle: row.vehicle,
    services,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    message: row.message,
    status: row.status,
    staffMemo: row.staff_memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function create(v) {
  const r = db.prepare(`INSERT INTO inquiries
      (kind, name, phone, vehicle, services, preferred_date, preferred_time, message, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(v.kind, v.name, v.phone, v.vehicle, JSON.stringify(v.services), v.preferredDate, v.preferredTime, v.message, v.ip);
  return Number(r.lastInsertRowid);
}

function list() {
  return db.prepare('SELECT * FROM inquiries WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 500').all().map(toPublic);
}

function update(id, { status, staffMemo }) {
  const r = db.prepare(`UPDATE inquiries SET status = ?, staff_memo = ?, updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL`).run(status, staffMemo, id);
  return r.changes > 0;
}

// 행을 지우지 않는다 — 잘못 지웠을 때 DB 에서 deleted_at 을 비우면 돌아온다.
function softDelete(id) {
  const r = db.prepare("UPDATE inquiries SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(id);
  return r.changes > 0;
}

module.exports = { create, list, update, softDelete, KIND_LABEL };
