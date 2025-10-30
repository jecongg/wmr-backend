const AssignMuridGuru = require('../models/assignMuridGuru.model');

const getUserIdFromRequest = (req) => req.user?.id;

exports.getStudentScheduleForDay = async (req, res) => {
  try {
    const { date } = req.query; 

    
    const studentId = getUserIdFromRequest(req);

    if (!studentId) {
      return res.status(401).json({ message: 'Otentikasi gagal.' });
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
      studentId: studentId,
      scheduleDay: dayOfWeek,
      status: 'active',
      startTime: { $ne: null }, 
    })
    .populate('teacherId', 'name email photo')
    .lean();


    const RescheduleRequest = require('../models/rescheduleRequest.model');
    const reschedulesToday = await RescheduleRequest.find({
      student: studentId,
      status: 'approved',
      requestedDate: {
        $gte: selectedDate,
        $lt: nextDay
      }
    })
    .populate({
      path: 'assignment',
      populate: { path: 'teacherId', select: 'name email photo' }
    })
    .lean();


    const cancelledToday = await RescheduleRequest.find({
      student: studentId,
      status: 'approved',
      originalDate: {
        $gte: selectedDate,
        $lt: nextDay
      }
    }).lean();


    const result = [];

    reschedulesToday.forEach(rs => {
      if (rs.assignment && rs.assignment.teacherId) {
        result.push({
          scheduleId: rs.assignment._id,
          lesson: rs.assignment.instrument || 'Les Musik',
          time: rs.requestedTime,
          startTime: rs.requestedTime,
          teacher: {
            _id: rs.assignment.teacherId._id,
            id: rs.assignment.teacherId._id,
            name: rs.assignment.teacherId.name,
            email: rs.assignment.teacherId.email,
            photo: rs.assignment.teacherId.photo,
          },
          isRescheduled: true
        });
      }
    });

    const skippedAssignments = new Set();
    cancelledToday.forEach(rs => {
      skippedAssignments.add(rs.assignment.toString());
    });

    for (const assignment of assignments) {
      const assignmentId = assignment._id.toString();
      
      if (skippedAssignments.has(assignmentId)) {
        console.log('Skipping assignment (moved to another day):', assignmentId);
        continue;
      }

      const alreadyAdded = result.some(r => r.scheduleId.toString() === assignmentId);
      if (alreadyAdded) {
        console.log('Assignment already added as reschedule:', assignmentId);
        continue;
      }

      result.push({
        scheduleId: assignment._id,
        lesson: assignment.instrument || 'Les Musik',
        time: `${assignment.startTime} - ${assignment.endTime}`,
        startTime: assignment.startTime,
        teacher: {
          _id: assignment.teacherId._id,
          id: assignment.teacherId._id,
          name: assignment.teacherId.name,
          email: assignment.teacherId.email,
          photo: assignment.teacherId.photo,
        },
        isRescheduled: false
      });
    }

    result.sort((a, b) => a.startTime.localeCompare(b.startTime));



    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching student schedule:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.getTeachersByStudent = async (req, res) => {
    try {
      const { studentId } = req.params;
      const { status } = req.query;
  
      const filter = { studentId };
      
      if (status) {
        filter.status = status;
      } else {
        filter.status = 'active'; 
      }
  
      const assignments = await AssignMuridGuru.find(filter)
        .populate('teacherId', 'name email phone bio photo hourlyRate')
        .sort({ createdAt: -1 });
  
      const teachers = assignments.map(assignment => ({
        assignmentId: assignment.id,
        teacher: assignment.teacherId,
        startDate: assignment.startDate,
        notes: assignment.notes,
        status: assignment.status
      }));
  
      res.status(200).json({ 
        success: true, 
        count: teachers.length,
        data: teachers 
      });
  
    } catch (error) {
      console.error('Error get teachers by student:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan pada server.' 
      });
    }
  };