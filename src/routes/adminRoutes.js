const path = require('path');
const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const inquiryModel = require('../models/inquiryModel');

const router = express.Router();

router.use(['/admin', '/api/admin'], requireAdmin);

router.get('/admin', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'));
});

router.get('/api/admin/inquiries', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(inquiryModel.list());
});

router.put('/api/admin/inquiries/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const status = b.status === 'done' ? 'done' : 'new';
  const staffMemo = typeof b.staffMemo === 'string' ? b.staffMemo.trim().slice(0, 1000) || null : null;
  if (!inquiryModel.update(id, { status, staffMemo })) return res.status(404).json({ message: '없는 접수입니다.' });
  return res.json({ ok: true });
});

router.delete('/api/admin/inquiries/:id', (req, res) => {
  if (!inquiryModel.softDelete(Number(req.params.id))) return res.status(404).json({ message: '없는 접수입니다.' });
  return res.json({ ok: true });
});

module.exports = router;
