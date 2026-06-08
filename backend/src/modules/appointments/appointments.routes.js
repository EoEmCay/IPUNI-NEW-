const express = require('express');
const router = express.Router();
const controller = require('./appointments.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAppointmentSchema } = require('./appointments.schema');

router.use(authMiddleware);
router.get('/doctor-notes', controller.getDoctorNotes);
router.get('/', controller.getAppointments);
router.post('/', validate(createAppointmentSchema), controller.createAppointment);
router.put('/:id', controller.updateAppointment);
router.delete('/:id', controller.deleteAppointment);

module.exports = router;
