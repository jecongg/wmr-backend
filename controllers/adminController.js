const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Teacher = require('../models/teacher.model'); // Path ke model Mongoose Teacher
const Student = require('../models/student.model');
const AssignMuridGuru = require('../models/assignMuridGuru.model');
const { uploadToGCS, deleteFromGCS } = require('../utils/uploadToGCS');


exports.listTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    return res.status(200).json(teachers);
  } catch (error) {
    console.error('Gagal mengambil data guru:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};


exports.updateTeacher = async (req, res) => {
  try{
    const id = req.params.id;
    const findTeacher = await Teacher.findById(id);
    if(!findTeacher){
      return res.status(400).json({message: 'Data guru tidak ditemukan.'});
    }
    await Teacher.updateOne({_id: id}, {
      ...req.body
    })
    return res.status(200).json({message: 'Data guru berhasil diperbarui.'});
  }catch(error){
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}
exports.inviteTeacher = async (req, res) => {
  const { email, name } = req.body;

  const data = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Guru dengan email ini sudah ada.' });
    }
    const newTeacher = await Teacher.create({ ...req.body, status: 'invited' });
    const registrationToken = jwt.sign(
      { teacherId: newTeacher._id, email: newTeacher.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const registrationLink = `${process.env.FRONTEND_URL}/register-teacher?token=${registrationToken}`;

    await transporter.sendMail({
      from: '"Wisma Musik Rhapsodi" <no-reply@wismamusik.com>',
      to: email,
      subject: 'Undangan Bergabung sebagai Guru',
      html: `
        <h3>Halo, ${name}!</h3>
        <p>Anda telah diundang untuk menjadi guru di Wisma Musik Rhapsodi. Silakan selesaikan pendaftaran Anda dengan mengklik tautan di bawah ini.</p>
        <a href="${registrationLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Selesaikan Pendaftaran</a>
        <p>Tautan ini hanya berlaku selama 24 jam.</p>
        <p>Jika Anda tidak merasa diundang, mohon abaikan email ini.</p>
      `,
    });


    res.status(201).json({ 
        message: 'Undangan telah berhasil dikirim.', 
        teacher: newTeacher 
    });

  } catch (error) {
    console.error('Gagal mengirim undangan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.listStudents = async(req,res) => {
    try{
      const fetchStudent = await Student.find();
      // console.log(fetchStudent);
      return res.status(200).json( fetchStudent);
    }catch(error){
      return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
    }
}

exports.deleteTeacher = async(req,res) => {
  try{
    const id = req.params.id;
    const findTeacher = await Teacher.findById(id);
    if(!findTeacher){
      return res.status(400).json({message: 'Data guru tidak ditemukan.'});
    }
    const selectedTeacher = await Teacher.findOne({_id: id})

    const photoUrl = selectedTeacher.photo;

    if(photoUrl){
      await deleteFromGCS(photoUrl);
    }
    // await Teacher.deleteOne({_id: id});
    await Teacher.updateOne({_id: id}, {deletedAt: new Date()});
    return res.status(200).json({message: 'Data guru berhasil dihapus.'});
  }catch(error){
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}

exports.addStudent = async(req,res) => {
  try{
    const { email, name } = req.body;

    // Cek duplikat email
    const existingStudent = await Student.findOne({ email, deletedAt: null });
    if (existingStudent) {
      return res.status(400).json({ message: 'Murid dengan email ini sudah ada.' });
    }

    const data = req.body;
    const newStudent = {
      ...data,
      status: 'invited', // Set status awal
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    const createdStudent = await Student.create(newStudent);

    const registrationToken = jwt.sign(
      { studentId: createdStudent._id, email: createdStudent.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const registrationLink = `${process.env.FRONTEND_URL}/register-student?token=${registrationToken}`;

    await transporter.sendMail({
      from: '"Wisma Musik Rhapsodi" <no-reply@wismamusik.com>',
      to: email,
      subject: 'Undangan Bergabung sebagai Murid',
      html: `
        <h3>Halo, ${name}!</h3>
        <p>Anda telah diundang untuk menjadi murid di Wisma Musik Rhapsodi. Silakan selesaikan pendaftaran Anda dengan mengklik tautan di bawah ini.</p>
        <a href="${registrationLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Selesaikan Pendaftaran</a>
        <p>Tautan ini hanya berlaku selama 24 jam.</p>
        <p>Jika Anda tidak merasa diundang, mohon abaikan email ini.</p>
      `,
    });

    return res.status(201).json({message: 'Murid berhasil ditambahkan.', student: createdStudent});
  }catch(error){
    console.error('Error adding student:', error); // Tambahkan log
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}

exports.deleteStudent = async(req,res) => {
  try{
    const id = req.params.id;
    const findStudent = await Student.findById(id);
    if(!findStudent){
      return res.status(400).json({message: 'Data murid tidak ditemukan.'});
    }

    await Student.updateOne({_id: id}, {deletedAt: new Date()});

    return res.status(200).json({message: 'Data murid berhasil dihapus.'});
  }catch(error){
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}

exports.updateStudent = async(req,res) => {
  try{
    const id = req.params.id;
    // console.log(req.body);
    const findStudent = await Student.findById(id);
    // console.log('findstudent',findStudent);
    if(!findStudent){
      return res.status(400).json({message: 'Data murid tidak ditemukan.'});
    }
    
    if (req.body.photo === '' && findStudent.photo) {
      try {
        await deleteFromGCS(findStudent.photo);
      } catch (gcsError) {
        console.error('Gagal menghapus foto lama dari GCS:', gcsError);
        // Jangan hentikan update, mungkin file sudah tidak ada
      }
      if(req.body.photo){
        const photoUrl = await uploadToGCS(req.file, 'students', findStudent.name);
        req.body.photo = photoUrl;
      }
    }
    // console.log('reqbody',req.body);
    await Student.updateOne({
      _id: id
    }, {
      ...req.body,
      updatedAt: new Date() // Selalu perbarui timestamp
    })

    return res.status(200).json({message: 'Data murid berhasil diperbarui.'});
  }catch(error){
    console.error('Error updating student:', error); // Tambahkan log
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}


exports.uploadTeacherPhoto = async (req, res) => {
  try {
    const id = req.params.id;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File foto tidak ditemukan.' });
    }

    if (teacher.photo) {
      await deleteFromGCS(teacher.photo);
    }

    const photoUrl = await uploadToGCS(req.file, 'teachers', teacher.name);
    await Teacher.updateOne(
      { _id: id },
      { photo: photoUrl }
    );

    return res.status(200).json({
      message: 'Foto profil guru berhasil diupload.',
      photoUrl: photoUrl,
    });
  } catch (error) {
    console.error('Error uploading teacher photo:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server.',
      error: error.message,
    });
  }
};

exports.uploadStudentPhoto = async (req, res) => {
  try{
    const id = req.params.id;
    const student = await Student.findById(id);
    if(!student){
      return res.status(400).json({message: 'Data murid tidak ditemukan.'});
    }
    if(!req.file){
      return res.status(400).json({message: 'File foto tidak ditemukan.'});
    }
    if(student.photo){
      await deleteFromGCS(student.photo);
    }
    const photoUrl = await uploadToGCS(req.file, 'students', student.name);
    await Student.updateOne({_id: id}, {photo: photoUrl});
    return res.status(200).json({message: 'Foto profil murid berhasil diupload.', photoUrl: photoUrl});
  }catch(error){
    return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
  }
}
exports.assignStudentToTeacher = async (req, res) => {
  try {
    const { teacherId, studentId, notes, startDate, scheduleDay, startTime, endTime, instrument } = req.body;

    // Validasi input
    if (!teacherId || !studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher ID dan Student ID harus diisi.' 
      });
    }

    // Cek apakah teacher dan student ada
    const teacher = await Teacher.findById(teacherId);
    const student = await Student.findById(studentId);

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guru tidak ditemukan.' 
      });
    }

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Murid tidak ditemukan.' 
      });
    }

    // Cek apakah sudah ada assignment aktif
    const existingAssignment = await AssignMuridGuru.findOne({
      teacherId,
      studentId,
      status: 'active'
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Murid sudah di-assign ke guru ini.' 
      });
    }

    // Buat assignment baru
    const assignment = new AssignMuridGuru({
      teacherId,
      studentId,
      assignedBy: req.user.id, // Admin yang melakukan assign
      notes,
      startDate: startDate || Date.now(),
      scheduleDay: scheduleDay || null,
      startTime: startTime || null,
      endTime: endTime || null,
      instrument: instrument || null,
      status: 'active'
    });

    await assignment.save();

    // Populate data teacher dan student
    await assignment.populate([
      { path: 'teacherId', select: 'name email phone' },
      { path: 'studentId', select: 'name email phone_number age' }
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Murid berhasil di-assign ke guru.',
      data: assignment 
    });

  } catch (error) {
    console.error('Error assign student to teacher:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const { status, teacherId, studentId } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (teacherId) {
      filter.teacherId = teacherId;
    }
    
    if (studentId) {
      filter.studentId = studentId;
    }

    const assignments = await AssignMuridGuru.find(filter)
      .populate('teacherId', 'name email phone')
      .populate('studentId', 'name email phone_number age')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: assignments.length,
      data: assignments 
    });

  } catch (error) {
    console.error('Error get all assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};

exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, endDate, notes, scheduleDay, startTime, endTime, instrument } = req.body;

    // Validasi status
    const validStatuses = ['active', 'inactive', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status tidak valid. Pilih: active, inactive, atau completed.' 
      });
    }

    const assignment = await AssignMuridGuru.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment tidak ditemukan.' 
      });
    }

    // Update fields
    if (status) {
      assignment.status = status;
    }
    
    if (endDate) {
      assignment.endDate = endDate;
    }
    
    if (notes !== undefined) {
      assignment.notes = notes;
    }
    
    if (scheduleDay !== undefined) {
      assignment.scheduleDay = scheduleDay;
    }
    
    if (startTime !== undefined) {
      assignment.startTime = startTime;
    }

    if (endTime !== undefined) {
      assignment.endTime = endTime;
    }
    
    if (instrument !== undefined) {
      assignment.instrument = instrument;
    }

    // Jika status diubah ke completed atau inactive, set endDate jika belum ada
    if ((status === 'completed' || status === 'inactive') && !assignment.endDate) {
      assignment.endDate = Date.now();
    }

    await assignment.save();

    await assignment.populate([
      { path: 'teacherId', select: 'name email phone' },
      { path: 'studentId', select: 'name email phone_number age' }
    ]);

    res.status(200).json({ 
      success: true, 
      message: 'Assignment berhasil diupdate.',
      data: assignment 
    });

  } catch (error) {
    console.error('Error update assignment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};


exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await AssignMuridGuru.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment tidak ditemukan.' 
      });
    }

    // Soft delete: ubah status menjadi inactive
    assignment.status = 'inactive';
    assignment.endDate = Date.now();
    await assignment.save();

    res.status(200).json({ 
      success: true, 
      message: 'Assignment berhasil dihapus (dinonaktifkan).' 
    });

  } catch (error) {
    console.error('Error delete assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};

// Hard delete assignment (permanent delete)
exports.permanentDeleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await AssignMuridGuru.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment tidak ditemukan.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Assignment berhasil dihapus permanen.' 
    });

  } catch (error) {
    console.error('Error permanent delete assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await AssignMuridGuru.findById(assignmentId)
      .populate('teacherId', 'name email phone bio photo')
      .populate('studentId', 'name email phone_number age address parent_name parent_phone')
      .populate('assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment tidak ditemukan.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: assignment 
    });

  } catch (error) {
    console.error('Error get assignment by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};

// Get statistics
exports.getAssignmentStats = async (req, res) => {
  try {
    const totalAssignments = await AssignMuridGuru.countDocuments();
    const activeAssignments = await AssignMuridGuru.countDocuments({ status: 'active' });
    const inactiveAssignments = await AssignMuridGuru.countDocuments({ status: 'inactive' });
    const completedAssignments = await AssignMuridGuru.countDocuments({ status: 'completed' });

    // Get teachers with most students
    const teachersWithStudentCount = await AssignMuridGuru.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$teacherId', studentCount: { $sum: 1 } } },
      { $sort: { studentCount: -1 } },
      { $limit: 5 }
    ]);

    // Populate teacher data
    const topTeachers = await Teacher.populate(teachersWithStudentCount, { 
      path: '_id', 
      select: 'name email' 
    });

    res.status(200).json({ 
      success: true, 
      data: {
        total: totalAssignments,
        active: activeAssignments,
        inactive: inactiveAssignments,
        completed: completedAssignments,
        topTeachers: topTeachers.map(t => ({
          teacher: t._id,
          studentCount: t.studentCount
        }))
      }
    });

  } catch (error) {
    console.error('Error get assignment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
};