const RescheduleRequest = require('../models/rescheduleRequest.model');
const Schedule = require('../models/schedule.model');
const mongoose = require('mongoose');

const getUserIdFromRequest = (req) => req.user?._id;

// Murid membuat permintaan ganti jadwal
exports.createRequest = async (req, res) => {
    try {
        const studentId = getUserIdFromRequest(req);
        const { scheduleId, originalDate, requestedDate, requestedTime, reason } = req.body;

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: 'Jadwal asli tidak ditemukan.' });
        }

        const newRequest = await RescheduleRequest.create({
            student: studentId,
            teacher: schedule.teacher,
            originalSchedule: scheduleId,
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
            .populate('originalSchedule', 'lesson time')
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
        const { status, teacherComment } = req.body; // status: 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid.' });
        }

        const request = await RescheduleRequest.findById(requestId);

        if (!request || request.teacher.toString() !== teacherId.toString()) {
            return res.status(404).json({ message: 'Permintaan tidak ditemukan atau Anda tidak berhak merespons.' });
        }

        request.status = status;
        request.teacherComment = teacherComment;
        await request.save();

        res.status(200).json({ message: `Permintaan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`, data: request });
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
            .populate('originalSchedule', 'lesson')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};