const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { sendSuccess } = require('../../utils/response.helper');
const { upsertCareLinkSchema } = require('./careLinks.schema');
const { getFamilyLinks, upsertFamilyLink } = require('./careLinks.service');

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

module.exports = router;
