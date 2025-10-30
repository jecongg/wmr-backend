const AssignMuridGuru = require('../models/assignMuridGuru.model');

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