const express = require('express');
const router = express.Router();
const clinicController = require('./clinic.controller');

router.get('/patients', clinicController.getPatients);
router.post('/checkin', clinicController.checkin);
router.post('/checkout', clinicController.checkout);
router.post('/notes', clinicController.updateNotes);
router.post('/prescription', clinicController.uploadPrescription);
router.get('/notifications', clinicController.getNotifications);
router.post('/clear', clinicController.clearAll);
router.post('/auth-check', clinicController.checkClinicAuthAndIp);

module.exports = router;
