const jwt = require("jsonwebtoken");
const { Teacher, Admin, Student } = require("../models");
const admin = require("../config/firebaseAdmin");

exports.completeRegistration = async (req, res) => {
    const { registrationToken, authProvider, password, firebaseUid } = req.body;

    try {
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        const teacher = await Teacher.findByPk(decoded.teacherId);

        if (!teacher || teacher.status !== "invited") {
            return res
                .status(400)
                .json({
                    message:
                        "Tautan pendaftaran tidak valid atau sudah digunakan.",
                });
        }

        let finalUid = firebaseUid;

        if (authProvider === "email") {
            try {
                // Coba buat pengguna baru di Firebase
                const userRecord = await admin.auth().createUser({
                    email: teacher.email,
                    password: password,
                    displayName: teacher.name,
                });
                finalUid = userRecord.uid;
            } catch (firebaseError) {
                // --- DI SINILAH LOGIKA BARUNYA ---
                // Jika errornya adalah karena email sudah ada...
                if (firebaseError.code === "auth/email-already-exists") {
                    console.log(
                        `Email ${teacher.email} sudah ada di Firebase. Mencoba menautkan akun...`
                    );
                    try {
                        // ...maka kita cari pengguna tersebut berdasarkan emailnya
                        const existingUser = await admin
                            .auth()
                            .getUserByEmail(teacher.email);

                        // Cek apakah pengguna yang ada ini sudah ditautkan ke guru lain
                        const teacherWithThisUid = await Teacher.findOne({
                            where: { authUid: existingUser.uid },
                        });
                        if (
                            teacherWithThisUid &&
                            teacherWithThisUid.id !== teacher.id
                        ) {
                            return res
                                .status(400)
                                .json({
                                    message:
                                        "Akun ini sudah terhubung dengan profil guru lain.",
                                });
                        }

                        // Jika aman, gunakan UID dari pengguna yang sudah ada
                        finalUid = existingUser.uid;
                        console.log(
                            `Berhasil menemukan UID: ${finalUid} untuk email ${teacher.email}`
                        );

                        // (Opsional tapi direkomendasikan) Update password pengguna yang sudah ada
                        // Ini berguna jika pengguna lupa password lamanya dan ingin menggunakan yang baru dari form ini.
                        await admin
                            .auth()
                            .updateUser(finalUid, { password: password });
                    } catch (lookupError) {
                        // Tangani jika terjadi error saat mencari pengguna
                        console.error(
                            "Gagal mencari pengguna yang sudah ada di Firebase:",
                            lookupError
                        );
                        throw new Error(
                            "Gagal memproses pendaftaran dengan email yang sudah ada."
                        );
                    }
                } else {
                    // Jika errornya bukan 'email-already-exists', lempar kembali error aslinya
                    console.error("Firebase Admin SDK Error:", firebaseError);
                    throw firebaseError;
                }
            }
        }

        if (!finalUid) {
            throw new Error(
                "UID pengguna tidak dapat ditentukan. Proses pendaftaran gagal."
            );
        }

        // Update tabel SQL kita dengan UID dan status
        await teacher.update({
            status: "active",
            authProvider: authProvider,
            authUid: finalUid,
        });

        res.status(200).json({
            message: "Pendaftaran berhasil! Anda sekarang bisa login.",
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res
                .status(400)
                .json({ message: "Tautan pendaftaran sudah kedaluwarsa." });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res
                .status(400)
                .json({ message: "Tautan pendaftaran tidak valid." });
        }
        console.error("Gagal menyelesaikan pendaftaran:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.handleGoogleLogin = async (req, res) => {
  console.log("halo dari bakend");
  
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ message: 'UID dan Email diperlukan.' });
  }

  try {
    // === TAHAP 1: PENGECEKAN BERDASARKAN UID (UNTUK PENGGUNA YANG KEMBALI) ===

    // 1. Cek tabel Admin
    let admin = await Admin.findOne({ where: { authUid: uid } });
    if (admin) {
      admin = admin.toJSON();
      admin.role = 'admin';
      return res.status(200).json({ success: true, user: admin });
    }

    // 2. Cek tabel Teacher
    let teacher = await Teacher.findOne({ where: { authUid: uid } });
    if (teacher) {
      teacher = teacher.toJSON();
      teacher.role = 'teacher';
      return res.status(200).json({ success: true, user: teacher });
    }

    // 3. Cek tabel Student
    let student = await Student.findOne({ where: { authUid: uid } });
    if (student) {
      student = student.toJSON();
      student.role = 'student';
      return res.status(200).json({ success: true, user: student });
    }
    
    // === TAHAP 2: PENAUTAN BERDASARKAN EMAIL (UNTUK LOGIN PERTAMA KALI) ===
    
    // 4. Cek email di tabel Admin
    admin = await Admin.findOne({ where: { email: email } });
    if (admin) {
      if (admin.authUid) return res.status(403).json({ success: false, message: 'Email admin ini sudah tertaut.' });
      admin.authUid = uid;
      await admin.save();
      admin = admin.toJSON();
      admin.role = 'admin';
      return res.status(200).json({ success: true, user: admin, message: 'Akun admin berhasil ditautkan.' });
    }

    // 5. Cek email di tabel Teacher
    teacher = await Teacher.findOne({ where: { email: email } });
    if (teacher) {
        if (teacher.authUid) return res.status(403).json({ success: false, message: 'Email guru ini sudah tertaut.' });
        teacher.authUid = uid;
        teacher.authProvider = 'google';
        await teacher.save();
        teacher = teacher.toJSON();
        teacher.role = 'teacher';
        return res.status(200).json({ success: true, user: teacher, message: 'Akun guru berhasil ditautkan.' });
    }

    // 6. Cek email di tabel Student
    student = await Student.findOne({ where: { email: email } });
    if (student) {
        if (student.authUid) return res.status(403).json({ success: false, message: 'Email murid ini sudah tertaut.' });
        student.authUid = uid;
        student.authProvider = 'google';
        await student.save();
        student = student.toJSON();
        student.role = 'student';
        return res.status(200).json({ success: true, user: student, message: 'Akun murid berhasil ditautkan.' });
    }

    // === TAHAP 3: JIKA TIDAK DITEMUKAN SAMA SEKALI ===
    return res.status(404).json({ 
        success: false, 
        code: 'email-not-registered',
        message: 'Email tidak terdaftar di sistem.' 
    });

  } catch (error) {
    console.error('Error saat proses Google login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};