const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { upload } = require('../utils/uploadToGCS');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// Teacher routes
router.get('/list-teachers', adminController.listTeachers);
router.post('/teachers', adminController.inviteTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);
router.post('/teachers/:id/upload-photo', upload.single('photo'), adminController.uploadTeacherPhoto);

// Student routes
router.get('/list-students', adminController.listStudents);
router.post('/students', adminController.addStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/:id/upload-photo', upload.single('photo'), adminController.uploadStudentPhoto);

//Assign Routes
router.post('/assign', authMiddleware, isAdmin, adminController.assignStudentToTeacher);
router.get('/assignments', authMiddleware, isAdmin, adminController.getAllAssignments);
router.get('/assignments/stats', authMiddleware, isAdmin, adminController.getAssignmentStats);
router.get('/assignments/:assignmentId', authMiddleware, isAdmin, adminController.getAssignmentById);
router.put('/assignments/:assignmentId/status', authMiddleware, isAdmin, adminController.updateAssignmentStatus);
router.delete('/assignments/:assignmentId', authMiddleware, isAdmin, adminController.deleteAssignment);
router.delete('/assignments/:assignmentId/permanent', authMiddleware, isAdmin, adminController.permanentDeleteAssignment);

module.exports = router;