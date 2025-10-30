const express = require('express');
const router = express.Router();
const assignmentCtrl = require('../controllers/assignmentController');
const { authMiddleware, isTeacher, isStudent, isAdmin } = require('../middleware/auth'); // Sesuaikan


// router.get('/teacher/:teacherId', authMiddleware, assignmentCtrl.getAssignmentsByTeacher);
router.get('/teacher/me', authMiddleware, isTeacher, async (req, res) => {
    req.params.teacherId = req.user.id;
    return assignmentCtrl.getAssignmentsByTeacher(req, res);
});
router.get('/student/me', authMiddleware, isStudent, assignmentCtrl.getActiveStudentAssignments);


module.exports = router;