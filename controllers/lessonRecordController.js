const LessonRecord = require('../models/lessonRecord.model');
const mongoose = require('mongoose');

// Helper untuk mendapatkan ID pengguna dari request
const getUserIdFromRequest = (req) => req.user?.id;

// Guru membuat atau memperbarui laporan les
exports.createOrUpdateLessonRecord = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        if (!teacherId) return res.status(401).json({ message: 'Otentikasi gagal.' });

        const { studentId, date, time, duration, type, status, materialsCovered, report, homework } = req.body;
        
        // Validasi dasar
        if (!studentId || !date || !time || !status) {
            return res.status(400).json({ message: 'Data tidak lengkap.' });
        }
        
        // Gunakan updateOne + upsert untuk efisiensi
        const result = await LessonRecord.updateOne(
            { teacher: teacherId, student: studentId, date: new Date(date) },
            { 
                $set: {
                    teacher: teacherId,
                    student: studentId,
                    date: new Date(date),
                    time,
                    duration,
                    type,
                    status,
                    materialsCovered,
                    report,
                    homework
                    // attachments akan dihandle terpisah jika ada upload file
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ message: 'Laporan les berhasil disimpan.', data: result });
    } catch (error) {
        console.error('Error creating lesson record:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru/Admin mendapatkan semua laporan untuk satu murid
exports.getRecordsForStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const records = await LessonRecord.find({ student: studentId })
            .populate('teacher', 'name')
            .sort({ date: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Murid mendapatkan riwayat laporannya sendiri
exports.getStudentOwnHistory = async (req, res) => {
    try {
        const studentId = getUserIdFromRequest(req);
        if (!studentId) return res.status(401).json({ message: 'Otentikasi gagal.' });

        const records = await LessonRecord.find({ student: studentId })
            .populate('teacher', 'name')
            .sort({ date: -1 });
            
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru mendapatkan riwayat laporan yang pernah dibuatnya
exports.getTeacherHistory = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        if (!teacherId) return res.status(401).json({ message: 'Otentikasi gagal.' });

        const records = await LessonRecord.find({ teacher: teacherId })
            .populate('student', 'name photo')
            .sort({ date: -1 });
            
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};