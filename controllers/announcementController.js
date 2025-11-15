const Announcement = require('../models/announcement.model');

const getUserIdFromRequest = (req) => req.user?._id;
const getUserRoleFromRequest = (req) => req.user?.constructor.modelName; 

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        const createdById = userId;
        
        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan konten tidak boleh kosong.' });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            createdBy: createdById,
        });
        
        await newAnnouncement.populate('createdBy', 'name');

        res.status(201).json({ message: 'Pengumuman berhasil dibuat.', data: newAnnouncement });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

exports.listAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name') 
            .sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
        }

        if (announcement.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Anda tidak berhak menghapus pengumuman ini.' });
        }

        await Announcement.findByIdAndDelete(id);

        res.status(200).json({ message: 'Pengumuman berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};