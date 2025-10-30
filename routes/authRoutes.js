const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/complete-registration', authController.completeRegistration);
router.post('/google-login', authController.handleGoogleLogin);
router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

module.exports = router;