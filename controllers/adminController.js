const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Teacher = require('../models/teacher.model'); // Path ke model Mongoose Teacher
const Student = require('../models/student.model');

/**
 * @desc Mengundang guru baru melalui email
 * @route POST /api/admin/invite-teacher
 * @access Private/Admin
 */
exports.inviteTeacher = async (req, res) => {
  const { email, name } = req.body;

  try {
    // 1. Cek apakah guru dengan email tersebut sudah ada
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Guru dengan email ini sudah ada.' });
    }

    // 2. Buat record guru baru dengan status 'invited'
    // req.body bisa berisi field lain seperti instrument, experience, dll.
    const newTeacher = await Teacher.create({ ...req.body, status: 'invited' });

    // 3. Buat token registrasi yang berlaku 24 jam
    // Di Mongoose, primary key adalah _id
    const registrationToken = jwt.sign(
      { teacherId: newTeacher._id, email: newTeacher.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Konfigurasi Nodemailer untuk mengirim email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const registrationLink = `${process.env.FRONTEND_URL}/register-teacher?token=${registrationToken}`;

    // 5. Kirim email undangan
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

    // 6. Kirim respons sukses
    // Berkat transform di model, 'newTeacher' akan otomatis di-serialize dengan 'id'
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

exports.addStudent = async(req,res) => {
  try{

    const data = req.body;
    const newStudent = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
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