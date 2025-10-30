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