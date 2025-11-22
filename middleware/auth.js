const admin = require('../config/firebaseAdmin'); // Impor Firebase Admin yang sudah diinisialisasi
const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacher.model'); // Sesuaikan path
const Student = require('../models/student.model'); // Sesuaikan path
const Admin = require('../models/admin.model');

/**
 * Middleware untuk memverifikasi JWT token dari Cookie atau Session.
 */
exports.authMiddleware = async (req, res, next) => {
  let token;
  let authenticated = false;

  if (req.session && req.session.user) {
    try {
      const sessionUser = req.session.user;
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

  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      const models = { Admin, Teacher, Student };
      const role = decodedToken.role;
      const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
      
      let user = await Model.findById(decodedToken.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Otentikasi gagal, pengguna tidak ditemukan.' });
      }
      
      if (user.status && user.status === 'inactive') {
        return res.status(403).json({ message: 'Akun Anda tidak aktif.' });
      }
      
      const userObj = user.toJSON();
      userObj.role = role;
      req.user = userObj;
      
      authenticated = true;
      return next();
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token expired. Silakan login ulang.' });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Token tidak valid.' });
      }
      console.error('Error verifikasi JWT token:', error);
      return res.status(401).json({ message: 'Otentikasi gagal.' });
    }
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    
    try {
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

exports.isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk guru.' });
  }
};


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

/**
 * Middleware khusus untuk memverifikasi HANYA menggunakan session.
 * Tidak menerima Firebase token, hanya session cookie.
 */
exports.requireSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Sesi tidak valid. Silakan login kembali.' 
      });
    }

    const sessionUser = req.session.user;
    const models = { Admin, Teacher, Student };
    const role = sessionUser.role;
    const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
    
    let user = await Model.findById(sessionUser.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User tidak ditemukan. Silakan login kembali.' 
      });
    }

    const userObj = user.toJSON();
    userObj.role = role;
    req.user = userObj;
    
    return next();

  } catch (error) {
    console.error('Error verifikasi session:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Sesi tidak valid. Silakan login kembali.' 
    });
  }
};