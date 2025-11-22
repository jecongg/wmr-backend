const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getTeachersByStudent, getStudentScheduleForDay } = require('../controllers/studentController');
const router = express.Router();

router.get('/schedule', authMiddleware, getStudentScheduleForDay);

router.get('/my-teachers', authMiddleware, async (req, res) => {
  req.params.studentId = req.user.id;
  return getTeachersByStudent(req, res);
});

router.get('/:studentId/teachers', authMiddleware, getTeachersByStudent);

module.exports = router;