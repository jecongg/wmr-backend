const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { upload } = require('../utils/uploadToGCS');

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

module.exports = router;