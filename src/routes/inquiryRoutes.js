const express = require('express');
const inquiryController = require('../controllers/inquiryController');

const router = express.Router();

// 견적 · 상담 문의와 작업 예약 신청 — 로그인 없이 받는다(회원 제도가 없는 사이트다).
router.post('/', inquiryController.create);

module.exports = router;
