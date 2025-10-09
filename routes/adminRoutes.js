const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // <-- Import controller

router.post('/teachers', adminController.inviteTeacher);

module.exports = router;