const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth'); // Sesuaikan path

// router.get(
//   '/teacher/schedule', 
//   authMiddleware,  
//   isTeacher,      
//   attendanceController.getTeacherScheduleForDay 
// );
router.post(
  '/teacher/mark', 
  authMiddleware,  
  isTeacher,      
  attendanceController.markAttendance 
);

router.get(
  '/student/history', 
  authMiddleware,  
  isStudent,       
  attendanceController.getStudentAttendanceHistory
);

module.exports = router;