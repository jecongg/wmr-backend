const Schedule = require('../models/schedule.model'); // Sesuaikan path
const Attendance = require('../models/attendance.model'); // Sesuaikan path
const mongoose = require('mongoose');

/**
 * Helper untuk mendapatkan ID pengguna dari request.
 * Middleware auth mungkin menempelkan user ke req.user atau req.auth.
 * ID bisa berupa .id atau ._id.
 */
const getUserIdFromRequest = (req) => {
    const user = req.user || req.auth; // Cek req.user atau req.auth
    if (!user) {
        return null; // Tidak ada objek user
    }
    return user.id || user._id; // Kembalikan id atau _id
};

/**
 * Mengambil jadwal guru untuk tanggal yang dipilih.
 */
exports.getTeacherScheduleForDay = async (req, res) => {
  try {
    const { date } = req.query; // Format YYYY-MM-DD
    
    // --- PERBAIKAN ---
    const teacherId = getUserIdFromRequest(req);

    if (!teacherId) {
        console.error('Error: Gagal mendapatkan teacherId dari request. Periksa authMiddleware.');
        return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
    }
    // --- AKHIR PERBAIKAN ---

    if (!date) {
      return res.status(400).json({ message: 'Tanggal wajib diisi.' });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getUTCDay(); // 0 = Minggu, 1 = Senin, ...

    // 1. Cari semua jadwal aktif guru untuk hari tersebut
    const schedules = await Schedule.find({
      teacher: teacherId,
      dayOfWeek: dayOfWeek,
      isActive: true,
    }).populate('students', 'name photo'); // Ambil data murid

    if (!schedules.length) {
      return res.status(200).json([]); // Tidak ada jadwal hari ini
    }

    // 2. Siapkan hasil
    const result = [];

    // 3. Loop setiap jadwal dan cari data absensi yang cocok
    for (const schedule of schedules) {
      // Cari absensi yang ada untuk jadwal & tanggal ini
      const existingAttendance = await Attendance.findOne({
        schedule: schedule._id,
        date: selectedDate,
      }).lean(); // .lean() untuk objek JS biasa

      let attendanceMap = {};
      if (existingAttendance) {
        // Buat map untuk pencarian cepat status murid
        existingAttendance.records.forEach(record => {
          attendanceMap[record.student.toString()] = {
            status: record.status,
            notes: record.notes
          };
        });
      }

      // Gabungkan data murid dengan status absensinya
      const studentsWithAttendance = schedule.students.map(student => {
        const attendance = attendanceMap[student._id.toString()];
        return {
          ...student.toObject(), // Data murid (name, photo, _id)
          status: attendance ? attendance.status : null, // Status (present, absent, excused) atau null
          notes: attendance ? attendance.notes : '',
        };
      });

      result.push({
        scheduleId: schedule._id,
        lesson: schedule.lesson,
        time: schedule.time,
        type: schedule.type,
        duration: schedule.duration,
        students: studentsWithAttendance,
        // Kirim ID dokumen absensi jika ada, untuk membedakan create/update
        attendanceId: existingAttendance ? existingAttendance._id : null 
      });
    }

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
    // --- PERBAIKAN ---
    const teacherId = getUserIdFromRequest(req);
    if (!teacherId) {
        console.error('Error: Gagal mendapatkan teacherId dari request. Periksa authMiddleware.');
        return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
    }
    // --- AKHIR PERBAIKAN ---

    const { scheduleId, date, records } = req.body;

    if (!scheduleId || !date || !records) {
      return res.status(400).json({ message: 'Data tidak lengkap.' });
    }
    
    const selectedDate = new Date(date);

    // Validasi data murid
    const validRecords = records.map(rec => ({
      student: new mongoose.Types.ObjectId(rec.studentId),
      status: rec.status,
      notes: rec.notes || ''
    }));

    // Gunakan updateOne dengan upsert: true
    const attendance = await Attendance.updateOne(
      { 
        schedule: new mongoose.Types.ObjectId(scheduleId), 
        date: selectedDate 
      },
      {
        $set: {
          teacher: new mongoose.Types.ObjectId(teacherId),
          records: validRecords,
          isCancelled: false // Pastikan tidak dibatalkan saat update
        },
        $setOnInsert: { // Hanya dijalankan saat dokumen baru DIBUAT
            schedule: new mongoose.Types.ObjectId(scheduleId),
            date: selectedDate,
        }
      },
      { upsert: true } // Kunci efisiensinya ada di sini
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
        // --- PERBAIKAN ---
        const studentId = getUserIdFromRequest(req);
        if (!studentId) {
            console.error('Error: Gagal mendapatkan studentId dari request. Periksa authMiddleware.');
            return res.status(401).json({ message: 'Otentikasi gagal. Tidak dapat menemukan data pengguna.' });
        }
        // --- AKHIR PERBAIKAN ---
        
        // Cari semua catatan absensi DI MANA murid ini ada di dalam 'records'
        const history = await Attendance.find({
            'records.student': studentId
        })
        .populate('schedule', 'lesson') // Ambil nama pelajaran
        .populate('teacher', 'name') // Ambil nama guru
        .sort({ date: -1 }) // Urutkan dari terbaru
        .limit(20); // Batasi 20 data terakhir

        // Olah data agar lebih mudah dibaca frontend
        const result = history.map(item => {
            // Cari data spesifik murid ini dari array records
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