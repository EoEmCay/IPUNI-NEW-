const express = require('express');
const router = express.Router();
const controller = require('./medications.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createMedicationSchema, updateMedicationSchema, logDoseSchema } = require('./medications.schema');

router.use(authMiddleware);
router.get('/today', controller.getTodayMedications);
router.get('/adherence', controller.getAdherence);
router.get('/logs', controller.getDoseHistory);
router.get('/', controller.getMedications);
router.post('/', validate(createMedicationSchema), controller.createMedication);
router.post('/:id/logs', validate(logDoseSchema), controller.logDose);
router.put('/:id', validate(updateMedicationSchema), controller.updateMedication);
router.delete('/:id', controller.deleteMedication);

module.exports = router;
