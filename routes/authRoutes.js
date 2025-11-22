const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/complete-registration', authController.completeRegistration);

router.post('/login-with-token', authController.loginWithToken);

router.post('/google-login', authController.handleGoogleLogin);
router.post('/google-login-token', authController.handleGoogleLoginWithToken);

// Set Firebase token in httpOnly cookie
router.post('/set-token', authController.setTokenCookie);

router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

router.post('/forgot-password', authController.forgotPassword);

module.exports = router;