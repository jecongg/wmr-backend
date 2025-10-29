const express = require('express');
const router = express.Router();
const moduleCtrl = require('../controllers/moduleController');
const { authMiddleware, isTeacher, isStudent } = require('../middleware/auth');
const { upload } = require('../utils/uploadToGCS'); // Pastikan path ini benar

// Rute Guru
router.post('/teacher/create', authMiddleware, isTeacher, upload.single('file'), moduleCtrl.createModule);
router.delete('/teacher/delete/:id', authMiddleware, isTeacher, moduleCtrl.deleteModule);

// Rute Umum (bisa diakses guru dan murid)
router.get('/', authMiddleware, moduleCtrl.listModules);

module.exports = router;