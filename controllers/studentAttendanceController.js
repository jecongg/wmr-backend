const StudentAttendance = require('../models/studentAttendance.model');
const AssignMuridGuru = require('../models/assignMuridGuru.model');

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId, date, startTime, endTime, status, materialsCovered, notes, homework } = req.body;

    if (!studentId || !date || !startTime || !endTime || !materialsCovered || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib harus diisi'
      });
    }

    const assignment = await AssignMuridGuru.findOne({
      teacherId,
      studentId,
      status: 'active'
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke murid ini'
      });
    }

    const attendance = new StudentAttendance({
      teacher: teacherId,
      student: studentId,
      date,
      startTime,
      endTime,
      status,
      materialsCovered,
      notes,
      homework: homework || ''
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Laporan pertemuan berhasil disimpan',
      data: attendance
    });

  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getStudentAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId } = req.params;

    const assignment = await AssignMuridGuru.findOne({
      teacherId,
      studentId,
      status: 'active'
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke murid ini'
      });
    }

    const attendances = await StudentAttendance.find({
      teacher: teacherId,
      student: studentId
    })
    .sort({ date: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });

  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attendanceId } = req.params;

    const attendance = await StudentAttendance.findById(attendanceId)
      .populate('student', 'name email age')
      .populate('teacher', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    // Cek apakah attendance ini milik teacher
    if (attendance.teacher._id.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attendanceId } = req.params;
    const { date, startTime, endTime, status, materialsCovered, notes, homework } = req.body;

    const attendance = await StudentAttendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    // Cek apakah attendance ini milik teacher
    if (attendance.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini'
      });
    }

    // Update fields
    if (date) attendance.date = date;
    if (startTime) attendance.startTime = startTime;
    if (endTime) attendance.endTime = endTime;
    if (status) attendance.status = status;
    if (materialsCovered) attendance.materialsCovered = materialsCovered;
    if (notes) attendance.notes = notes;
    if (homework !== undefined) attendance.homework = homework;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Laporan berhasil diupdate',
      data: attendance
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attendanceId } = req.params;

    const attendance = await StudentAttendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    // Cek apakah attendance ini milik teacher
    if (attendance.teacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini'
      });
    }

    await StudentAttendance.findByIdAndDelete(attendanceId);

    res.status(200).json({
      success: true,
      message: 'Laporan berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get all attendances for teacher (all students)
exports.getAllTeacherAttendances = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { startDate, endDate, studentId } = req.query;

    const filter = { teacher: teacherId };

    if (studentId) {
      filter.student = studentId;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendances = await StudentAttendance.find(filter)
      .populate('student', 'name email')
      .sort({ date: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });

  } catch (error) {
    console.error('Error fetching teacher attendances:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

