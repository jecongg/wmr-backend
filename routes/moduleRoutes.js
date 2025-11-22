const express = require('express');
const router = express.Router();
const moduleCtrl = require('../controllers/moduleController');
const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth');
const { uploadModule } = require('../utils/uploadToGCS'); 

router.post('/teacher/create', authMiddleware, uploadModule.single('file'), moduleCtrl.createModule);
router.delete('/teacher/delete/:id', authMiddleware, isTeacher, moduleCtrl.deleteModule);

router.get('/', authMiddleware, moduleCtrl.listModules);

router.get('/student/:id', authMiddleware, isTeacher, moduleCtrl.getStudentModules);

module.exports = router;