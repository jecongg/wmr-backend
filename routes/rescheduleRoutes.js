const express = require('express');
const router = express.Router();
const rescheduleCtrl = require('../controllers/rescheduleController');
const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth');

// Rute Murid
router.post('/student/create', authMiddleware, isStudent, rescheduleCtrl.createRequest);
router.get('/student/history', authMiddleware, isStudent, rescheduleCtrl.getStudentRequests);

// Rute Guru
router.get('/teacher/requests', authMiddleware, isTeacher, rescheduleCtrl.getTeacherRequests);
router.put('/teacher/respond/:requestId', authMiddleware, isTeacher, rescheduleCtrl.respondToRequest);

module.exports = router;