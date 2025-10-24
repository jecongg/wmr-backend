const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 


router.post('/teachers', adminController.inviteTeacher);
router.get('/list-students', adminController.listStudents);
router.delete('/students/:id', adminController.deleteStudent);
router.put('/students/:id', adminController.updateStudent);
router.post('/students', adminController.addStudent);

module.exports = router;