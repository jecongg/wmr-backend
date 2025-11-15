const Schedule = require('../models/schedule.model'); // Sesuaikan path
const Attendance = require('../models/attendance.model'); // Sesuaikan path
const AssignMuridGuru = require('../models/assignMuridGuru.model'); // Tambahkan model assignment
const mongoose = require('mongoose');

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


exports.getTeacherScheduleForDay = async (req, res) => {
  try {
    const { date } = req.query;
    
    const teacherId = getUserIdFromRequest(req);

    if (!teacherId) {
        console.error('Error: Gagal mendapatkan teacherId dari request. Periksa authMiddleware.');
        return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Tanggal wajib diisi.' });
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayOfWeek = dayNames[selectedDate.getDay()]; 


    const assignments = await AssignMuridGuru.find({
      teacherId: teacherId,
      scheduleDay: dayOfWeek,
      status: 'active',
      startTime: { $ne: null }, 
    })
    .populate('studentId', 'name email photo')
    .lean();


    const RescheduleRequest = require('../models/rescheduleRequest.model');
    const reschedulesToday = await RescheduleRequest.find({
      teacher: teacherId,
      status: 'approved',
      requestedDate: {
        $gte: selectedDate,
        $lt: nextDay
      }
    })
    .populate({
      path: 'assignment',
      populate: { path: 'studentId', select: 'name email photo' }
    })
    .lean();


    const cancelledToday = await RescheduleRequest.find({
      teacher: teacherId,
      status: 'approved',
      originalDate: {
        $gte: selectedDate,
        $lt: nextDay
      }
    }).lean();


    const skippedAssignments = new Set();
    cancelledToday.forEach(rs => {
      skippedAssignments.add(rs.assignment.toString());
    });

    const scheduleMap = {};

    reschedulesToday.forEach(rs => {
      if (rs.assignment && rs.assignment.studentId) {
        const startTime = rs.requestedTime;
        const assignment = rs.assignment;
        let endTime = startTime;
        
        if (assignment.startTime && assignment.endTime) {
          const [origStart] = assignment.startTime.split(':');
          const [origEnd] = assignment.endTime.split(':');
          const duration = parseInt(origEnd) - parseInt(origStart);
          const [newHour, newMin] = startTime.split(':');
          endTime = `${String(parseInt(newHour) + duration).padStart(2, '0')}:${newMin}`;
        }

        const timeKey = `${startTime}-${endTime}`;
        
        if (!scheduleMap[timeKey]) {
          scheduleMap[timeKey] = {
            scheduleId: assignment._id,
            lesson: assignment.instrument || 'Les Musik',
            time: `${startTime} - ${endTime}`,
            startTime: startTime,
            endTime: endTime,
            students: [],
            isRescheduled: true
          };
        }

        scheduleMap[timeKey].students.push({
          _id: assignment.studentId._id,
          id: assignment.studentId._id,
          name: assignment.studentId.name,
          email: assignment.studentId.email,
          photo: assignment.studentId.photo,
        });
      }
    });

    
    const result = Object.values(scheduleMap).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

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

    const attendance = await Attendance.updateOne(
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
        
        const history = await Attendance.find({
            'records.student': studentId
        })
        .populate('schedule', 'lesson') 
        .populate('teacher', 'name') 
        .sort({ date: -1 }) // Urutkan dari desc
        .limit(20); 

        const result = history.map(item => {
            const myRecord = item.records.find(
                rec => rec.student.toString() === studentId
            );

            return {
                attendanceId: item._id,
                date: item.date,
                lesson: item.schedule ? item.schedule.lesson : 'N/A',
                teacher: item.teacher ? item.teacher.name : 'N/A',
                status: myRecord ? myRecord.status : 'N/A',
                notes: myRecord ? myRecord.notes : '',
            };
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching student history:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};