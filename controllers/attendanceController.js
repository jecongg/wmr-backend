const Schedule = require('../models/schedule.model'); 
const StudentA = require('../models/attendance.model'); 
const AssignMuridGuru = require('../models/assignMuridGuru.model');
const mongoose = require('mongoose');
const studentAttendanceModel = require('../models/studentAttendance.model');

/**
 * Helper untuk mendapatkan ID pengguna dari request.
 * Middleware auth mungkin menempelkan user ke req.user atau req.auth.
 * ID bisa berupa .id atau ._id.
 */
const getUserIdFromRequest = (req) => {
    const user = req.user || req.auth; 
    if (!user) {
        return null; 
    }
    return user.id || user._id;
};

// NOTE: getTeacherScheduleForDay has been moved to teacherController.js
// This controller now focuses on attendance marking and history only

/**
 * Menyimpan atau memperbarui data absensi untuk satu sesi kelas.
 */
exports.markAttendance = async (req, res) => {
  try {
    const teacherId = getUserIdFromRequest(req);
    if (!teacherId) {
        console.error('Error: Gagal mendapatkan teacherId dari request. Periksa authMiddleware.');
        return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
    }

    const { scheduleId, date, records } = req.body;

    if (!scheduleId || !date || !records) {
      return res.status(400).json({ message: 'Data tidak lengkap.' });
    }
    
    const selectedDate = new Date(date);

    const validRecords = records.map(rec => ({
      student: new mongoose.Types.ObjectId(rec.studentId),
      status: rec.status,
      notes: rec.notes || ''
    }));

    const attendance = await studentAttendanceModel.updateOne(
      { 
        schedule: new mongoose.Types.ObjectId(scheduleId), 
        date: selectedDate 
      },
      {
        $set: {
          teacher: new mongoose.Types.ObjectId(teacherId),
          records: validRecords,
          isCancelled: false 
        },
        $setOnInsert: { 
            schedule: new mongoose.Types.ObjectId(scheduleId),
            date: selectedDate,
        }
      },
      { upsert: true } 
    );

    return res.status(200).json({ message: 'Absensi berhasil disimpan.', data: attendance });

  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Mengambil riwayat absensi untuk SATU murid (dilihat oleh murid).
 */
exports.getStudentAttendanceHistory = async (req, res) => {
    try {
        const studentId = getUserIdFromRequest(req);
        if (!studentId) {
            console.error('Error: Gagal mendapatkan studentId dari request. Periksa authMiddleware.');
            return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
        }
        
        const history = await studentAttendanceModel.find({
            student: studentId
        })
        .populate('teacher', 'name') 
        .sort({ date: -1 }) 
        .limit(50); 

        const result = history.map(item => ({
            attendanceId: item._id || item.id,
            date: item.date,
            lesson: item.materialsCovered || 'N/A',
            teacher: item.teacher ? item.teacher.name : 'N/A',
            status: item.status || 'N/A',
            notes: item.notes || '',
            startTime: item.startTime,
            endTime: item.endTime,
            time: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'N/A'
        }));

        return res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching student history:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};