const Announcement = require('../models/announcement.model');

const getUserIdFromRequest = (req) => req.user?._id;
const getUserRoleFromRequest = (req) => req.user?.constructor.modelName; // 'Admin' atau 'Teacher'

// Membuat pengumuman (bisa oleh Admin atau Guru)
exports.createAnnouncement = async (req, res) => {
    try {
        const createdById = getUserIdFromRequest(req);
        const createdByType = getUserRoleFromRequest(req); // Mendapatkan 'Admin' atau 'Teacher'
        
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan konten tidak boleh kosong.' });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            createdBy: createdById,
            createdByType: createdByType
        });
        
        // Populate untuk response agar nama pembuatnya langsung ada
        await newAnnouncement.populate('createdBy', 'name');

        res.status(201).json({ message: 'Pengumuman berhasil dibuat.', data: newAnnouncement });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Mendapatkan semua pengumuman
exports.listAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name') // Mengambil nama dari model Admin atau Teacher
            .sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Menghapus pengumuman
exports.deleteAnnouncement = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
        }

        // Cek apakah user yang menghapus adalah pembuatnya
        if (announcement.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Anda tidak berhak menghapus pengumuman ini.' });
        }

        await Announcement.findByIdAndDelete(id);

        res.status(200).json({ message: 'Pengumuman berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};