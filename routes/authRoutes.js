const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/complete-registration', authController.completeRegistration);

// Generic login endpoint untuk semua auth provider (Google, Email/Password, dll)
router.post('/login-with-token', authController.loginWithToken);

// Backward compatibility endpoints
router.post('/google-login', authController.handleGoogleLogin);
router.post('/google-login-token', authController.handleGoogleLoginWithToken);

router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

router.post('/forgot-password', authController.forgotPassword);

module.exports = router;