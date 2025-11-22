const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const AssignMuridGuru = require('../models/assignMuridGuru.model');

exports.getStudentsByTeacher = async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { status } = req.query;
  
      const filter = { teacherId };
      
      if (status) {
        filter.status = status;
      } else {
        filter.status = 'active';
      }
  
      const assignments = await AssignMuridGuru.find(filter)
        .populate('studentId', 'name email phone_number age address parent_name parent_phone')
        .sort({ createdAt: -1 });
  
      const students = assignments.map(assignment => ({
        assignmentId: assignment.id,
        student: assignment.studentId,
        startDate: assignment.startDate,
        scheduleDay: assignment.scheduleDay,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        notes: assignment.notes,
        status: assignment.status
      }));
  
      res.status(200).json({ 
        success: true, 
        count: students.length,
        data: students 
      });
  
    } catch (error) {
      console.error('Error get students by teacher:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan pada server.' 
      });
    }
  };

  exports.getTeacherScheduleForDay = async (req, res) => {
    try {
      const { date } = req.query; 
  
      const teacherId = req.user?.id || req.user?._id;
  
      if (!teacherId) {
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
  
      const skippedAssignments = new Set();
      cancelledToday.forEach(rs => {
        skippedAssignments.add(rs.assignment.toString());
      });
  
      for (const assignment of assignments) {
        const assignmentId = assignment._id.toString();
        
        if (skippedAssignments.has(assignmentId)) {
          continue;
        }
  
        const timeKey = `${assignment.startTime}-${assignment.endTime}`;
        
        if (!scheduleMap[timeKey]) {
          scheduleMap[timeKey] = {
            scheduleId: assignment._id,
            lesson: assignment.instrument || 'Les Musik',
            time: `${assignment.startTime} - ${assignment.endTime}`,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            students: [],
            isRescheduled: false
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
  
      const result = Object.values(scheduleMap).sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
  
      return res.status(200).json(result);
  
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
  };