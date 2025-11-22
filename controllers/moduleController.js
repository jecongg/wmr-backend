const Module = require('../models/module.model');
const socketService = require('../services/socketService');
const { uploadToGCS, deleteFromGCS } = require('../utils/uploadToGCS');

exports.createModule = async (req, res) => {
    try {
        const teacherId = req.user?.id || req.user?._id;
        if (!teacherId) return res.status(401).json({ message: 'Otentikasi gagal.' });
        
        const { title, description, link} = req.body;
        let type = req.body.type;
        
        
        let fileUrl = '';
        let fileName = '';
        
        if (type === 'file' || type === 'video') {
            if (!req.file) {
                return res.status(400).json({ message: 'File tidak ditemukan.' });
            }
            fileUrl = await uploadToGCS(req.file, 'modules', title);
            fileName = req.file.originalname;
        }else {
            return res.status(400).json({ message: 'Tipe modul tidak valid.' });
        }
        const newModule = await Module.create({
            title,
            description,
            type,
            url: fileUrl,
            fileName,
            teacher: teacherId,
            student: req.body.student,
        });

        socketService.emitToAll('module-created', newModule);

        res.status(201).json({ message: 'Modul berhasil diunggah.', data: newModule });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Mendapatkan semua modul (bisa untuk murid atau guru)
exports.listModules = async (req, res) => {
    try {
        const modules = await Module.find().populate('teacher', 'name').sort({ createdAt: -1 });
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru menghapus modul
exports.deleteModule = async (req, res) => {
    try {
        const teacherId = req.user?.id || req.user?._id;
        const { id } = req.params;

        const module = await Module.findById(id);
        if (!module) return res.status(404).json({ message: 'Modul tidak ditemukan.' });

        if (module.teacher.toString() !== teacherId.toString()) {
            return res.status(403).json({ message: 'Anda tidak punya akses untuk menghapus modul ini.' });
        }
        
        if (module.type === 'file') {
            await deleteFromGCS(module.url);
        }

        await Module.findByIdAndDelete(id);

        socketService.emitToAll('module-deleted', { id });
        
        res.status(200).json({ message: 'Modul berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

exports.getStudentModules = async(req,res) => {
    try{
        const { id } = req.params;
        const module = await Module.find({student: id});

        return res.status(200).json(module);
    }catch(err){
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}