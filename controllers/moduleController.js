const Module = require('../models/module.model');
// Asumsi Anda punya fungsi uploadToGCS dari kode sebelumnya
const { uploadToGCS, deleteFromGCS } = require('../utils/uploadToGCS');

const getUserIdFromRequest = (req) => req.user?._id;

// Guru mengunggah modul baru
exports.createModule = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        if (!teacherId) return res.status(401).json({ message: 'Otentikasi gagal.' });
        
        const { title, description, category, type, link } = req.body;
        let fileUrl = '';
        let fileName = '';

        if (type === 'file' && req.file) {
            fileUrl = await uploadToGCS(req.file, 'modules', title);
            fileName = req.file.originalname;
        } else if (type === 'link' || type === 'video') {
            fileUrl = link;
        } else {
            return res.status(400).json({ message: 'Data tidak lengkap atau tipe modul tidak valid.' });
        }

        const newModule = await Module.create({
            title,
            description,
            category,
            type,
            url: fileUrl,
            fileName,
            teacher: teacherId
        });

        res.status(201).json({ message: 'Modul berhasil diunggah.', data: newModule });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Mendapatkan semua modul (bisa untuk murid atau guru)
exports.listModules = async (req, res) => {
    try {
        // Logika untuk murid: cari modul dari gurunya
        // Logika untuk guru: cari modul miliknya
        // Untuk sederhana, kita tampilkan semua dulu, bisa difilter di frontend
        const modules = await Module.find().populate('teacher', 'name').sort({ createdAt: -1 });
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru menghapus modul
exports.deleteModule = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        const { id } = req.params;

        const module = await Module.findById(id);
        if (!module) return res.status(404).json({ message: 'Modul tidak ditemukan.' });

        // Pastikan hanya pembuat modul yang bisa menghapus
        if (module.teacher.toString() !== teacherId.toString()) {
            return res.status(403).json({ message: 'Anda tidak punya akses untuk menghapus modul ini.' });
        }
        
        if (module.type === 'file') {
            await deleteFromGCS(module.url);
        }

        await Module.findByIdAndDelete(id);
        res.status(200).json({ message: 'Modul berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};