const admin = require('../config/firebaseAdmin'); // Impor Firebase Admin yang sudah diinisialisasi
const Teacher = require('../models/teacher.model'); // Sesuaikan path
const Student = require('../models/student.model'); // Sesuaikan path

/**
 * Middleware untuk memverifikasi token JWT dari Firebase.
 */
exports.authMiddleware = async (req, res, next) => {
  let token;

  // Cek token di header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Ambil token dari header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verifikasi token menggunakan FIREBASE ADMIN SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // decodedToken.uid adalah 'authUid' dari database Anda
      const authUid = decodedToken.uid; 

      // 3. Cari pengguna di database MongoDB Anda menggunakan authUid
      let user = await Teacher.findOne({ authUid: authUid }).select('-password');
      if (!user) {
        user = await Student.findOne({ authUid: authUid }).select('-password');
      }

      if (!user) {
        // Ini terjadi jika user ada di Firebase Auth, tapi belum terdaftar di database Anda
        return res.status(401).json({ message: 'Otentikasi berhasil, tapi pengguna tidak terdaftar di sistem.' });
      }
      
      // 4. TEMPELKAN data pengguna (dari database MongoDB Anda) ke req.user
      req.user = user; 

      next(); // Lanjut ke middleware berikutnya (isTeacher / isStudent)

    } catch (error) {
      console.error('Error verifikasi token Firebase:', error);
      return res.status(401).json({ message: 'Otentikasi gagal, token Firebase tidak valid.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Otentikasi gagal, tidak ada token.' });
  }
};

/**
 * Middleware untuk mengecek role Guru.
 * Dijalankan SETELAH authMiddleware.
 * (TIDAK PERLU DIUBAH)
 */
exports.isTeacher = (req, res, next) => {
  // req.user sekarang berisi data dari MongoDB
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk guru.' });
  }
};

/**
 * Middleware untuk mengecek role Murid.
 * Dijalankan SETELAH authMiddleware.
 * (TIDAK PERLU DIUBAH)
 */
exports.isStudent = (req, res, next) => {
  // req.user sekarang berisi data dari MongoDB
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk murid.' });
  }
};