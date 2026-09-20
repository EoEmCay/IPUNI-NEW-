const express = require('express');
const router = express.Router();
const clinicController = require('./clinic.controller');
const { streamHandler } = require('../../realtime/sse.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Realtime SSE stream cho phòng khám (token nhận qua query)
router.get('/stream', streamHandler);

router.get('/patients', clinicController.getPatients);

// QUAN TRỌNG: đây là 2 route DUY NHẤT thực sự đụng DB thật (qua clinic.service.js#assertCanView
// - kiểm tra bác sĩ/clinic_admin có quyền xem đúng bệnh nhân này không). TRƯỚC ĐÂY không có
// authMiddleware nên req.user luôn undefined -> controller fallback cứng userId=1, khiến JWT
// của bác sĩ thật bị bỏ qua hoàn toàn (không ai xem đúng hồ sơ được) VÀ để hở dữ liệu bệnh
// nhân cho bất kỳ ai gọi thẳng API không cần đăng nhập. Các route còn lại bên dưới (checkin,
// getPatients...) thao tác trên dữ liệu demo trong RAM (clinicPatients, xem clinic.controller.js)
// - không phải hồ sơ bệnh nhân thật - nên CỐ Ý giữ nguyên không auth để không phá tính năng
// đồng bộ demo điện thoại<->laptop (cloudApi trong frontend/src/pages/Clinic/clinicService.js).
router.get('/patients/:id', authMiddleware, clinicController.patientDetail);
router.post('/alerts/:alertId/ack', authMiddleware, clinicController.acknowledgeAlert);

router.post('/checkin', clinicController.checkin);
router.post('/checkout', clinicController.checkout);
router.post('/notes', clinicController.updateNotes);
router.post('/prescription', clinicController.uploadPrescription);
router.get('/notifications', clinicController.getNotifications);
router.post('/clear', clinicController.clearAll);
router.post('/auth-check', clinicController.checkClinicAuthAndIp);

module.exports = router;
