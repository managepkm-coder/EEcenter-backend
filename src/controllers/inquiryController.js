const inquiryModel = require('../models/inquiryModel');
const site = require('../content/site');

const SERVICE_SLUGS = new Set([...site.services.map((s) => s.slug), 'conversion']);
const TIMES = new Set(['am', 'pm']);

// 로그인 없이 받는 문이라 IP 당 접수 건수를 막는다. 서버를 다시 켜면 비워지는 정도로 충분하다 —
// 막으려는 것은 사람이 아니라 같은 접수를 쏟아붓는 프로그램이다. 저장된 접수만 센다: 칸을 잘못 적어
// 막힌 시도까지 세면 번호를 몇 번 고쳐 쓴 손님이 정작 접수를 못 하게 된다(저장되지 않은 시도는 비용도 없다).
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map();

function recent(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, list);
  return list;
}

function record(ip) {
  if (hits.size > 5000) hits.clear();
  recent(ip).push(Date.now());
}

function text(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

// 010 휴대폰만 받는다 — 담당자가 전화와 문자로 일정을 확정하는 자리다.
function normalizeMobile(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!/^010\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 서울 기준 오늘(YYYY-MM-DD). 서버 시각은 UTC 라 그대로 쓰면 밤 9시 이후에 하루가 어긋난다.
function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// 주말은 휴무라 예약 날짜로 받지 않는다(운영 시간 — site.js). 화면의 inquiry.js 와 같은 기준이다.
// 'YYYY-MM-DD' 를 UTC 자정으로 읽어 요일을 본다 — 서버 시간대에 따라 하루가 밀리지 않게.
// 공휴일은 해마다 날짜가 달라 막지 않는다. 신청을 받은 뒤 운영팀이 확인해 일정을 잡는다.
function isWeekend(ymd) {
  const day = new Date(`${ymd}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

async function create(req, res) {
  const b = req.body || {};
  // 사람 눈에 보이지 않는 칸(website)이 채워져 오면 자동 등록 프로그램이다. 받은 척만 한다.
  if (b.website) return res.status(201).json({ ok: true });
  if (recent(req.ip).length >= LIMIT) {
    return res.status(429).json({ message: `잠시 뒤에 다시 보내주세요. 급하시면 ${site.company.tel} 로 전화 주세요.` });
  }

  const kind = b.kind === 'booking' ? 'booking' : b.kind === 'quote' ? 'quote' : null;
  const name = text(b.name, 30);
  const phone = normalizeMobile(b.phone);
  const vehicle = text(b.vehicle, 60) || null;
  const services = Array.isArray(b.services) ? [...new Set(b.services.filter((s) => SERVICE_SLUGS.has(s)))] : [];
  const message = typeof b.message === 'string' ? b.message.trim().slice(0, 2000) : '';

  const problems = [];
  if (!kind) problems.push('접수 종류가 올바르지 않습니다.');
  if (!name) problems.push('이름을 입력해주세요.');
  if (!phone) problems.push('휴대폰 번호를 010-0000-0000 형식으로 입력해주세요.');
  if (b.agree !== true) problems.push('개인정보 수집 · 이용에 동의해주세요.');

  let preferredDate = null;
  let preferredTime = null;
  if (kind === 'booking') {
    preferredDate = typeof b.preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.preferredDate) ? b.preferredDate : null;
    // 모양만 맞고 없는 날짜(2026-02-30 같은 것)는 요일을 셀 수 없어 버린다.
    if (preferredDate && new Date(`${preferredDate}T00:00:00Z`).toISOString().slice(0, 10) !== preferredDate) preferredDate = null;
    preferredTime = TIMES.has(b.preferredTime) ? b.preferredTime : null;
    if (!preferredDate) problems.push('희망 날짜를 골라주세요.');
    else if (preferredDate < todayKst()) problems.push('지난 날짜는 고를 수 없습니다.');
    else if (isWeekend(preferredDate)) problems.push('주말은 휴무라 예약할 수 없습니다. 평일 날짜를 골라주세요.');
    if (!services.length) problems.push('받으실 작업을 하나 이상 골라주세요.');
  } else if (kind === 'quote' && !services.length && !message) {
    problems.push('원하시는 작업을 고르시거나 문의 내용을 적어주세요.');
  }
  if (problems.length) return res.status(400).json({ message: problems[0], problems });

  const id = inquiryModel.create({ kind, name, phone, vehicle, services, preferredDate, preferredTime, message: message || null, ip: req.ip });
  record(req.ip);
  return res.status(201).json({ ok: true, id });
}

module.exports = { create, normalizeMobile };
