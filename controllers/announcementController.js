const Announcement = require('../models/announcement.model.js');

// Get all announcements
exports.ListAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// Create new announcement
exports.CreateAnnouncement = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Konten pengumuman tidak boleh kosong.'
            });
        }

        const newAnnouncement = new Announcement({ content });
        await newAnnouncement.save();

        return res.status(201).json({
            success: true,
            message: 'Pengumuman berhasil dibuat.',
            data: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// Delete announcement
exports.DeleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Pengumuman tidak ditemukan.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pengumuman berhasil dihapus.'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};