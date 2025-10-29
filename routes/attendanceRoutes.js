const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth'); // Sesuaikan path

// --- Rute untuk Guru ---
router.get(
  '/teacher/schedule', 
  authMiddleware,  // 1. Cek login
  isTeacher,       // 2. Cek role
  attendanceController.getTeacherScheduleForDay // 3. Jalankan controller
);
router.post(
  '/teacher/mark', 
  authMiddleware,  // 1. Cek login
  isTeacher,       // 2. Cek role
  attendanceController.markAttendance // 3. Jalankan controller
);

// --- Rute untuk Murid ---
router.get(
  '/student/history', 
  authMiddleware,  // 1. Cek login
  isStudent,       // 2. Cek role
  attendanceController.getStudentAttendanceHistory // 3. Jalankan controller
);

module.exports = router;