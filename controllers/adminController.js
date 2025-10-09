const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Teacher } = require('../models'); // Sesuaikan path jika perlu

// Fungsi untuk mengundang guru
// Semua logika yang tadinya ada di dalam router.post() dipindahkan ke sini
exports.inviteTeacher = async (req, res) => {
  const { email, name } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Guru dengan email ini sudah ada.' });
    }

    const newTeacher = await Teacher.create({ ...req.body, status: 'invited' });

    const registrationToken = jwt.sign(
      { teacherId: newTeacher.id, email: newTeacher.email },
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
        <p>Anda telah diundang untuk menjadi guru. Silakan selesaikan pendaftaran Anda dengan mengklik tautan di bawah ini.</p>
        <a href="${registrationLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Selesaikan Pendaftaran</a>
        <p>Tautan ini hanya berlaku selama 24 jam.</p>
      `,
    });

    res.status(201).json({ message: 'Undangan telah berhasil dikirim.', teacher: newTeacher });
  } catch (error) {
    console.error('Gagal mengirim undangan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};  