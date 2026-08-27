const express = require('express');
const router = express.Router();
const clinicController = require('./clinic.controller');
const { streamHandler } = require('../../realtime/sse.controller');

// Realtime SSE stream cho phòng khám (token nhận qua query)
router.get('/stream', streamHandler);

router.get('/patients', clinicController.getPatients);
router.get('/patients/:id', clinicController.patientDetail);
router.post('/alerts/:alertId/ack', clinicController.acknowledgeAlert);
router.post('/checkin', clinicController.checkin);
router.post('/checkout', clinicController.checkout);
router.post('/notes', clinicController.updateNotes);
router.post('/prescription', clinicController.uploadPrescription);
router.get('/notifications', clinicController.getNotifications);
router.post('/clear', clinicController.clearAll);
router.post('/auth-check', clinicController.checkClinicAuthAndIp);

module.exports = router;
