const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher.model");
const Admin = require("../models/admin.model");
const Student = require("../models/student.model");
const firebaseAdmin = require("../config/firebaseAdmin");

exports.completeRegistration = async (req, res) => {
    const { registrationToken, authProvider, password, firebaseUid } = req.body;

    try {
        // 1. Verifikasi token JWT dari email (Tidak ada perubahan di sini)
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        
        // 2. [PERUBAHAN] Cari guru menggunakan Mongoose
        // Sequelize: Teacher.findByPk(decoded.teacherId)
        // Mongoose: Teacher.findById(decoded.teacherId)
        const teacher = await Teacher.findById(decoded.teacherId);

        if (!teacher || teacher.status !== "invited") {
            return res.status(400).json({ message: "Tautan pendaftaran tidak valid atau sudah digunakan." });
        }

        let finalUid = firebaseUid;

        // 3. Logika interaksi dengan Firebase (Tidak ada perubahan di sini, ini sudah benar)
        if (authProvider === "email") {
            try {
                const userRecord = await firebaseAdmin.auth().createUser({
                    email: teacher.email,
                    password: password,
                    displayName: teacher.name,
                });
                finalUid = userRecord.uid;
            } catch (firebaseError) {
                if (firebaseError.code === "auth/email-already-exists") {
                    try {
                        const existingUser = await firebaseAdmin.auth().getUserByEmail(teacher.email);
                        const teacherWithThisUid = await Teacher.findOne({ authUid: existingUser.uid });

                        // [PERUBAHAN KECIL] Cara membandingkan ID di Mongoose
                        // ID di Mongoose adalah objek, jadi kita konversi ke string untuk perbandingan aman
                        if (teacherWithThisUid && teacherWithThisUid._id.toString() !== teacher._id.toString()) {
                            return res.status(400).json({ message: "Akun ini sudah terhubung dengan profil guru lain." });
                        }

                        finalUid = existingUser.uid;
                        await firebaseAdmin.auth().updateUser(finalUid, { password: password });
                    } catch (lookupError) {
                        console.error("Gagal mencari pengguna yang sudah ada di Firebase:", lookupError);
                        throw new Error("Gagal memproses pendaftaran dengan email yang sudah ada.");
                    }
                } else {
                    throw firebaseError;
                }
            }
        }

        if (!finalUid) {
            return res.status(400).json({ message: "UID pengguna tidak dapat ditentukan." });
        }

        // 4. [PERUBAHAN] Update dokumen guru di MongoDB menggunakan Mongoose
        // Sequelize: await teacher.update({ status: 'active', ... })
        // Mongoose: Ubah properti lalu panggil .save()
        teacher.status = "active";
        teacher.authProvider = authProvider;
        teacher.authUid = finalUid;
        await teacher.save(); // Simpan perubahan ke database

        res.status(200).json({ message: "Pendaftaran berhasil! Anda sekarang bisa login." });

    } catch (error) {
        // 5. Logika error handling (Tidak ada perubahan di sini, ini sudah benar)
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

        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ authUid: uid });
            if (userDoc) {
                const user = userDoc.toJSON(); 
                user.role = role;
                // console.log(user);
                
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid
                };
                
                return res.status(200).json({ success: true, user });
            }
        }
        
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
                
                // Set session cookie
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid
                };
                
                return res.status(200).json({ success: true, user, message: `Akun ${role} berhasil ditautkan.` });
            }
        }
        
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

// Logout handler
exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Gagal logout." });
            }
            res.clearCookie('connect.sid'); 
            return res.status(200).json({ success: true, message: "Logout berhasil." });
        });
    } catch (error) {
        console.error("Error saat logout:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// Get current session
exports.getSession = async (req, res) => {
    try {
        if (req.session.user) {
            // Fetch fresh user data from database
            const models = { Admin, Teacher, Student };
            const role = req.session.user.role;
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            
            const userDoc = await Model.findById(req.session.user.id).select('-password');
            if (userDoc) {
                const user = userDoc.toJSON();
                user.role = role;
                return res.status(200).json({ success: true, user });
            }
        }
        return res.status(401).json({ success: false, message: "Tidak ada sesi aktif." });
    } catch (error) {
        console.error("Error saat mengambil sesi:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};