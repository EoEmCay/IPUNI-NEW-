const express = require('express');
const router = express.Router();
const controller = require('./medications.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createMedicationSchema } = require('./medications.schema');

router.use(authMiddleware);
router.get('/today', controller.getTodayMedications);
router.get('/', controller.getMedications);
router.post('/', validate(createMedicationSchema), controller.createMedication);
router.put('/:id', controller.updateMedication);
router.delete('/:id', controller.deleteMedication);

module.exports = router;
