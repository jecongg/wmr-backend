const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher.model");
const Admin = require("../models/admin.model");
const Student = require("../models/student.model");
const firebaseAdmin = require("../config/firebaseAdmin");

exports.completeRegistration = async (req, res) => {
    const { registrationToken, authProvider, password, firebaseUid } = req.body;

    try {
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        const teacher = await Teacher.findById(decoded.teacherId);

        if (!teacher || teacher.status !== "invited") {
            return res.status(400).json({ message: "Tautan pendaftaran tidak valid atau sudah digunakan." });
        }

        let finalUid = firebaseUid;

        // Logika untuk membuat atau menautkan pengguna di Firebase Authentication
        if (authProvider === "email") {
            try {
                // Coba buat pengguna baru di Firebase
                const userRecord = await firebaseAdmin.auth().createUser({
                    email: teacher.email,
                    password: password,
                    displayName: teacher.name,
                });
                finalUid = userRecord.uid;
            } catch (firebaseError) {
                // Jika email sudah ada di Firebase, cari dan tautkan
                if (firebaseError.code === "auth/email-already-exists") {
                    const existingUser = await firebaseAdmin.auth().getUserByEmail(teacher.email);
                    const teacherWithThisUid = await Teacher.findOne({ authUid: existingUser.uid });

                    // Pastikan UID Firebase ini tidak terhubung ke guru LAIN
                    if (teacherWithThisUid && teacherWithThisUid._id.toString() !== teacher._id.toString()) {
                        return res.status(400).json({ message: "Akun ini sudah terhubung dengan profil guru lain." });
                    }

                    finalUid = existingUser.uid;
                    await firebaseAdmin.auth().updateUser(finalUid, { password: password });
                } else {
                    throw firebaseError; // Lempar error Firebase lainnya
                }
            }
        }

        if (!finalUid) {
            return res.status(400).json({ message: "UID pengguna tidak dapat ditentukan." });
        }

        // Update record guru di MongoDB
        teacher.status = "active";
        teacher.authProvider = authProvider;
        teacher.authUid = finalUid;
        await teacher.save();

        res.status(200).json({ message: "Pendaftaran berhasil! Anda sekarang bisa login." });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ message: "Tautan pendaftaran sudah kedaluwarsa." });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ message: "Tautan pendaftaran tidak valid." });
        }
        console.error("Gagal menyelesaikan pendaftaran:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.handleGoogleLogin = async (req, res) => {
    const { uid, email } = req.body;

    if (!uid || !email) {
        return res.status(400).json({ message: "UID dan Email diperlukan." });
    }
    
    try {
        const models = { Admin, Teacher, Student };
        const roles = ['admin', 'teacher', 'student'];

        // Tahap 1: Cek berdasarkan UID (untuk pengguna yang kembali login)
        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ authUid: uid });
            if (userDoc) {
                const user = userDoc.toJSON(); // Gunakan toJSON() untuk menerapkan transform
                user.role = role;
                console.log(user);
                
                return res.status(200).json({ success: true, user });
            }
        }
        
        // Tahap 2: Cek berdasarkan Email (untuk login pertama kali / penautan)
        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ email: email });
            if (userDoc) {
                if (userDoc.authUid) {
                    return res.status(403).json({ success: false, message: `Email ini sudah tertaut dengan akun ${role} lain.` });
                }
                userDoc.authUid = uid;
                userDoc.authProvider = 'google'; // Asumsi dari nama fungsi
                await userDoc.save();
                
                const user = userDoc.toJSON();
                user.role = role;
                return res.status(200).json({ success: true, user, message: `Akun ${role} berhasil ditautkan.` });
            }
        }
        
        // Tahap 3: Jika tidak ditemukan sama sekali
        return res.status(404).json({
            success: false,
            code: "email-not-registered",
            message: "Email tidak terdaftar di sistem kami.",
        });

    } catch (error) {
        console.error("Error saat proses Google login:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};