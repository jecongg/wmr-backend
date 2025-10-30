const admin = require('../config/firebaseAdmin'); // Impor Firebase Admin yang sudah diinisialisasi
const Teacher = require('../models/teacher.model'); // Sesuaikan path
const Student = require('../models/student.model'); // Sesuaikan path
const Admin = require('../models/admin.model');

/**
 * Middleware untuk memverifikasi token JWT dari Firebase atau Session Cookie.
 */
exports.authMiddleware = async (req, res, next) => {
  let token;
  let authenticated = false;

  if (req.session && req.session.user) {
    try {
      const sessionUser = req.session.user;
      // console.log('sessionUser', sessionUser);
      const models = { Admin, Teacher, Student };
      const role = sessionUser.role;
      const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
      
      let user = await Model.findById(sessionUser.id).select('-password');
      
      if (user) {
        const userObj = user.toJSON();
        userObj.role = role;
        req.user = userObj;
        authenticated = true;
        return next();
      }
    } catch (error) {
      console.error('Error verifikasi session:', error);
    }
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const authUid = decodedToken.uid; 

      let user = await Teacher.findOne({ authUid: authUid }).select('-password');
      let role = 'teacher';
      
      if (!user) {
        user = await Student.findOne({ authUid: authUid }).select('-password');
        role = 'student';
      }
      
      if (!user) {
        user = await Admin.findOne({ authUid: authUid }).select('-password');
        role = 'admin';
      }

      if (!user) {
        return res.status(401).json({ message: 'Otentikasi berhasil, tapi pengguna tidak terdaftar di sistem.' });
      }
      
      const userObj = user.toJSON();
      userObj.role = role;
      req.user = userObj; 

      authenticated = true;
      return next(); 

    } catch (error) {
      console.error('Error verifikasi token Firebase:', error);
      return res.status(401).json({ message: 'Otentikasi gagal, token Firebase tidak valid.' });
    }
  }

  if (!authenticated) {
    return res.status(401).json({ message: 'Otentikasi gagal, tidak ada token atau sesi.' });
  }
};

/**
 * Middleware untuk mengecek role Guru.
 * Dijalankan SETELAH authMiddleware.
 * (TIDAK PERLU DIUBAH)
 */
exports.isTeacher = (req, res, next) => {
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
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk murid.' });
  }
};

/**
 * Middleware untuk mengecek role Admin.
 * Dijalankan SETELAH authMiddleware.
 */
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk admin.' });
  }
};