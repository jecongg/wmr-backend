const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Teacher = require('../models/teacher.model'); // Path ke model Mongoose Teacher
const Student = require('../models/student.model');
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

    const data = req.body;
    const newStudent = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    const registrationToken = jwt.sign(
      { teacherId: newStudent._id, email: newStudent.email },
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
    const fetch = await Student.create(newStudent);

    return res.status(201).json({message: 'Murid berhasil ditambahkan.', student: fetch});
  }catch(error){
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
    const findStudent = await Student.findById(id);
    if(!findStudent){
      return res.status(400).json({message: 'Data murid tidak ditemukan.'});
    }
    if(req.body.photo !== findStudent.photo){
      if(findStudent.photo){
        await deleteFromGCS(findStudent.photo);
      }
      const photoUrl = await uploadToGCS(req.file, 'students', findStudent.name);
      req.body.photo = photoUrl;
    }
    await Student.updateOne({
      _id: id
    }, {
      ...req.body
    })

    return res.status(200).json({message: 'Data murid berhasil diperbarui.'});
  }catch(error){
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