const express = require('express');
const router = express.Router();
const controller = require('./advice.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', controller.getAdvice);
router.post('/analyze-meal', controller.analyzeMeal);
router.get('/:id', controller.getAdviceById);

module.exports = router;
