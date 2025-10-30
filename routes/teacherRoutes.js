const { authMiddleware } = require("../middleware/auth");
const express = require('express');
const { getStudentsByTeacher } = require('../controllers/teacherController');
const router = express.Router();

router.get('/my-students', authMiddleware, async (req, res) => {
    req.params.teacherId = req.user.id;
    return getStudentsByTeacher(req, res);
  });
  
  // Get students by specific teacher ID (Admin or Teacher)
router.get('/:teacherId/students', authMiddleware, getStudentsByTeacher);

module.exports = router;