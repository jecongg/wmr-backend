const express = require('express');
const router = express.Router();
const recordCtrl = require('../controllers/lessonRecordController');
const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth');

// Rute Guru
router.post('/teacher/create', authMiddleware, isTeacher, recordCtrl.createOrUpdateLessonRecord);
router.get('/teacher/history', authMiddleware, isTeacher, recordCtrl.getTeacherHistory);
router.get('/teacher/student/:studentId', authMiddleware, isTeacher, recordCtrl.getRecordsForStudent);

// Rute Murid
router.get('/student/history', authMiddleware, isStudent, recordCtrl.getStudentOwnHistory);

module.exports = router;