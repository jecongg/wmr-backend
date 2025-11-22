const Announcement = require('../models/announcement.model');
const socketService = require('../services/socketService');

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

        socketService.notifyNewAnnouncement(newAnnouncement);

        res.status(201).json({ message: 'Pengumuman berhasil dibuat.', data: newAnnouncement });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

exports.listAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const totalCount = await Announcement.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);

        const announcements = await Announcement.find()
            .populate('createdBy', 'name') 
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            announcements,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
        }
        await Announcement.findByIdAndDelete(id);

        socketService.emitToAll('announcement-deleted', { id });

        res.status(200).json({ message: 'Pengumuman berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};