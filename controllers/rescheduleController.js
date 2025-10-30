const RescheduleRequest = require('../models/rescheduleRequest.model');
// Ganti Schedule dengan AssignMuridGuru
const AssignMuridGuru = require('../models/assignMuridGuru.model'); 
const mongoose = require('mongoose');

// (WAJIB) Perbaiki helper ini seperti yang kita diskusikan sebelumnya
const getUserIdFromRequest = (req) => req.user?.id;

// Murid membuat permintaan ganti jadwal
exports.createRequest = async (req, res) => {
    try {
        const studentId = getUserIdFromRequest(req);
        // Input dari frontend sekarang adalah assignmentId
        const { assignmentId, originalDate, requestedDate, requestedTime, reason } = req.body;

        // Validasi duplikat: Cek apakah sudah ada request pending untuk tanggal ini
        const existingRequest = await RescheduleRequest.findOne({
            assignment: assignmentId,
            originalDate,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(409).json({ message: 'Anda sudah mengajukan permintaan untuk jadwal ini.' });
        }

        // Cari assignment yang sesuai
        const assignment = await AssignMuridGuru.findById(assignmentId);
        if (!assignment || assignment.studentId.toString() !== studentId) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan atau bukan milik Anda.' });
        }

        const newRequest = await RescheduleRequest.create({
            student: studentId,
            teacher: assignment.teacherId, // Ambil teacherId dari assignment
            assignment: assignmentId,
            originalDate,
            requestedDate,
            requestedTime,
            reason
        });

        res.status(201).json({ message: 'Permintaan ganti jadwal berhasil dikirim.', data: newRequest });
    } catch (error) {
        console.error('Error creating reschedule request:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru mendapatkan semua permintaan yang ditujukan padanya
exports.getTeacherRequests = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        const requests = await RescheduleRequest.find({ teacher: teacherId, status: 'pending' })
            .populate('student', 'name photo')
            // Populate assignment untuk memberikan konteks (hari apa, jam berapa)
            .populate('assignment', 'scheduleDay startTime instrument')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Guru merespons permintaan (approve/reject)
exports.respondToRequest = async (req, res) => {
    try {
        const teacherId = getUserIdFromRequest(req);
        const { requestId } = req.params;
        const { status, teacherComment } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid.' });
        }

        const request = await RescheduleRequest.findById(requestId);

        if (!request || request.teacher.toString() !== teacherId) {
            return res.status(404).json({ message: 'Permintaan tidak ditemukan atau Anda tidak berhak merespons.' });
        }
        
        // Mencegah status diubah jika sudah final
        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Permintaan ini sudah di-${request.status}.` });
        }

        request.status = status;
        request.teacherComment = teacherComment;
        await request.save();

        // Karena sistem hanya sebagai 'reminder', kita TIDAK perlu mengubah data lain.
        // Cukup ubah status permintaan ini. Guru akan melihat ini saat membuat laporan.

        res.status(200).json({ message: `Permintaan berhasil di-${status}.`, data: request });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Murid melihat riwayat permintaannya
exports.getStudentRequests = async (req, res) => {
    try {
        const studentId = getUserIdFromRequest(req);
        const requests = await RescheduleRequest.find({ student: studentId })
            .populate('teacher', 'name')
            .populate('assignment', 'scheduleDay startTime instrument')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};