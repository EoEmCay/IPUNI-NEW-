const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { sendSuccess } = require('../../utils/response.helper');
const { upsertCareLinkSchema, joinFamilySchema } = require('./careLinks.schema');
const svc = require('./careLinks.service');
const { getFamilyLinks, upsertFamilyLink } = svc;

router.use(authMiddleware);

// GET /api/v1/care-links — Danh sách người thân liên kết của bệnh nhân hiện tại
router.get('/', async (req, res, next) => {
  try { sendSuccess(res, await getFamilyLinks(req.user.id)); } catch (err) { next(err); }
});

// POST /api/v1/care-links — Thêm hoặc cập nhật người thân (relation='family')
router.post('/', validate(upsertCareLinkSchema), async (req, res, next) => {
  try {
    const link = await upsertFamilyLink(req.user.id, req.validatedBody);
    sendSuccess(res, link, 'Đã lưu thông tin người thân', 201);
  } catch (err) { next(err); }
});

// ── Gia đình liên kết bằng mã tài khoản ──
router.post('/family/join', validate(joinFamilySchema), async (req, res, next) => {
  try { sendSuccess(res, await svc.joinFamilyByCode(req.user.id, req.validatedBody.code), 'Đã kết nối gia đình', 201); } catch (err) { next(err); }
});
router.get('/family/members', async (req, res, next) => {
  try { sendSuccess(res, await svc.getFamilyMembers(req.user.id)); } catch (err) { next(err); }
});
router.delete('/family/members/:memberId', async (req, res, next) => {
  try { await svc.leaveFamily(req.user.id, Number(req.params.memberId)); sendSuccess(res, null, 'Đã gỡ kết nối'); } catch (err) { next(err); }
});
router.get('/family/alerts', async (req, res, next) => {
  try { sendSuccess(res, await svc.getFamilyAlerts(req.user.id)); } catch (err) { next(err); }
});
router.post('/family/alerts/:alertId/ack', async (req, res, next) => {
  try { await svc.ackFamilyAlert(req.user.id, Number(req.params.alertId)); sendSuccess(res, null, 'Đã xác nhận'); } catch (err) { next(err); }
});

// POST /api/v1/care-links/sos — Người bệnh bấm SOS: báo khẩn cho mọi người nhà
router.post('/sos', async (req, res, next) => {
  try { sendSuccess(res, await svc.sendSos(req.user.id), 'Đã gửi cảnh báo SOS'); } catch (err) { next(err); }
});

module.exports = router;
