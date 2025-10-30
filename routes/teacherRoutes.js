const { authMiddleware, isTeacher } = require("../middleware/auth");
const express = require('express');
const { getStudentsByTeacher } = require('../controllers/teacherController');
const studentAttendanceController = require('../controllers/studentAttendanceController');
const router = express.Router();

// Students routes
router.get('/:teacherId/students', authMiddleware, getStudentsByTeacher);


router.get('/my-students', authMiddleware, isTeacher, async (req, res) => {
    req.params.teacherId = req.user.id;
    return getStudentsByTeacher(req, res);
});

// Attendance routes
router.post('/attendance/create', authMiddleware, isTeacher, studentAttendanceController.createAttendance);
router.get('/student/:studentId/attendances', authMiddleware, isTeacher, studentAttendanceController.getStudentAttendanceHistory);
router.get('/attendance/:attendanceId', authMiddleware, isTeacher, studentAttendanceController.getAttendanceById);
router.put('/attendance/:attendanceId', authMiddleware, isTeacher, studentAttendanceController.updateAttendance);
router.delete('/attendance/:attendanceId', authMiddleware, isTeacher, studentAttendanceController.deleteAttendance);
router.get('/attendances', authMiddleware, isTeacher, studentAttendanceController.getAllTeacherAttendances);

module.exports = router;