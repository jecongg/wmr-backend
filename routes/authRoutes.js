const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // <-- Import controller

router.post('/complete-registration', authController.completeRegistration);
router.post('/google-login', authController.handleGoogleLogin);

module.exports = router;