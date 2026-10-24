-- 신규 설치용. 이미 배포된 DB 에는 CREATE TABLE IF NOT EXISTS 가 새 컬럼을 넣어주지 않는다 —
-- 컬럼을 더하면 migrate.js 의 addMissingColumns 목록에도 같이 넣는다.

-- 견적 · 상담 문의와 작업 예약 신청. 두 화면이 받는 값이 거의 같아 한 표에 kind 로 가른다.
CREATE TABLE IF NOT EXISTS inquiries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kind            TEXT NOT NULL,              -- quote(견적 · 상담) | booking(작업 예약)
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,              -- 010-0000-0000 모양으로 맞춰 담는다
  vehicle         TEXT,                       -- 차종 · 연식(적은 그대로)
  services        TEXT,                       -- 고른 서비스 slug JSON 배열
  preferred_date  TEXT,                       -- YYYY-MM-DD (예약만)
  preferred_time  TEXT,                       -- am | pm (예약만)
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'new',  -- new | done
  staff_memo      TEXT,
  ip              TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC 문자열
  updated_at      TEXT,
  deleted_at      TEXT                        -- 삭제는 표시만 남긴다
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries (created_at);
