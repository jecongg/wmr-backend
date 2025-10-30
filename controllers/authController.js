const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher.model");
const Admin = require("../models/admin.model");
const Student = require("../models/student.model");
const firebaseAdmin = require("../config/firebaseAdmin");

exports.completeRegistration = async (req, res) => {
    const { registrationToken, authProvider, password, firebaseUid } = req.body;

    try {
        const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        
        let user;
        let userType;
        
        if (decoded.teacherId) {
            user = await Teacher.findById(decoded.teacherId);
            userType = "teacher";
        } else if (decoded.studentId) {
            user = await Student.findById(decoded.studentId);
            userType = "student";
        } else {
            return res.status(400).json({ message: "Tautan pendaftaran tidak valid." });
        }

        if (!user || user.status !== "invited") {
            return res.status(400).json({ message: "Tautan pendaftaran tidak valid atau sudah digunakan." });
        }

        let finalUid = firebaseUid;

        if (authProvider === "email") {
            try {
                const userRecord = await firebaseAdmin.auth().createUser({
                    email: user.email,
                    password: password,
                    displayName: user.name,
                });
                finalUid = userRecord.uid;
            } catch (firebaseError) {
                if (firebaseError.code === "auth/email-already-exists") {
                    try {
                        const existingUser = await firebaseAdmin.auth().getUserByEmail(user.email);
                        
                        const Model = userType === "teacher" ? Teacher : Student;
                        const userWithThisUid = await Model.findOne({ authUid: existingUser.uid });

                        if (userWithThisUid && userWithThisUid._id.toString() !== user._id.toString()) {
                            const userTypeLabel = userType === "teacher" ? "guru" : "murid";
                            return res.status(400).json({ message: `Akun ini sudah terhubung dengan profil ${userTypeLabel} lain.` });
                        }

                        finalUid = existingUser.uid;
                        await firebaseAdmin
                            .auth()
                            .updateUser(finalUid, { password: password });
                    } catch (lookupError) {
                        console.error(
                            "Gagal mencari pengguna yang sudah ada di Firebase:",
                            lookupError
                        );
                        throw new Error(
                            "Gagal memproses pendaftaran dengan email yang sudah ada."
                        );
                    }
                } else {
                    throw firebaseError;
                }
            }
        }

        if (!finalUid) {
            return res
                .status(400)
                .json({ message: "UID pengguna tidak dapat ditentukan." });
        }

        user.status = "active";
        user.authProvider = authProvider;
        user.authUid = finalUid;
        await user.save(); 
        
        res.status(200).json({ message: "Pendaftaran berhasil! Anda sekarang bisa login." });

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

exports.loginWithToken = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            success: false,
            message: "ID Token diperlukan.",
        });
    }

    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: "Token tidak valid atau tidak mengandung UID/Email.",
            });
        }
        

        const authProvider = decodedToken.firebase.sign_in_provider;

        const models = { Admin, Teacher, Student };
        const roles = ["admin", "teacher", "student"];

        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ authUid: uid });
            if (userDoc) {
                const user = userDoc.toJSON();
                user.role = role;

                if(userDoc.status && userDoc.status === 'inactive') {
                    return res.status(403).json({ 
                        success: false,
                        message: `Akun Anda berstatus '${userDoc.status}'. Silakan hubungi administrator.`
                    });
                }
                
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid,
                };

                return res.status(200).json({ success: true, user });
            }
        }

        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ email: email });
            if (userDoc) {
                if (userDoc.authUid && userDoc.authUid !== uid) {
                    return res.status(403).json({
                        success: false,
                        message: `Email ini sudah tertaut dengan akun ${role} lain.`,
                    });
                }

                if (!userDoc.authUid) {
                    userDoc.authUid = uid;
                    userDoc.authProvider =
                        authProvider === "google.com" ? "google" : "email";
                    await userDoc.save();
                }

                if(userDoc.status && userDoc.status === 'inactive') {
                    return res.status(403).json({ 
                        success: false, 
                        message: `Akun Anda berstatus '${userDoc.status}'. Silakan hubungi administrator.`
                    });
                }
                
                const user = userDoc.toJSON();
                user.role = role;

                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid,
                };

                return res.status(200).json({
                    success: true,
                    user,
                    message: userDoc.authUid
                        ? undefined
                        : `Akun ${role} berhasil ditautkan.`,
                });
            }
        }

        return res.status(404).json({
            success: false,
            code: "email-not-registered",
            message: "Email tidak terdaftar di sistem kami.",
        });
    } catch (error) {
        if (error.code === "auth/id-token-expired") {
            return res.status(401).json({
                success: false,
                message: "Token sudah expired. Silakan login ulang.",
            });
        }
        if (
            error.code === "auth/argument-error" ||
            error.code === "auth/invalid-id-token"
        ) {
            return res.status(401).json({
                success: false,
                message: "Token tidak valid.",
            });
        }
        console.error("Error saat proses login dengan token:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    }
};

exports.handleGoogleLoginWithToken = exports.loginWithToken;

exports.handleGoogleLogin = async (req, res) => {
    const { uid, email } = req.body;
    if (!uid || !email) {
        return res.status(400).json({ message: "UID dan Email diperlukan." });
    }

    try {
        const models = { Admin, Teacher, Student };
        const roles = ["admin", "teacher", "student"];

        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ authUid: uid });
            if (userDoc) {
                const user = userDoc.toJSON();
                user.role = role;

                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid,
                };

                return res.status(200).json({ success: true, user });
            }
        }

        for (const role of roles) {
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];
            let userDoc = await Model.findOne({ email: email });
            if (userDoc) {
                if (userDoc.authUid) {
                    return res
                        .status(403)
                        .json({
                            success: false,
                            message: `Email ini sudah tertaut dengan akun ${role} lain.`,
                        });
                }
                userDoc.authUid = uid;
                userDoc.authProvider = "google";
                await userDoc.save();

                const user = userDoc.toJSON();
                user.role = role;

                req.session.user = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    authUid: uid,
                };

                return res
                    .status(200)
                    .json({
                        success: true,
                        user,
                        message: `Akun ${role} berhasil ditautkan.`,
                    });
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

exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ success: false, message: "Gagal logout." });
            }
            res.clearCookie("connect.sid");
            return res
                .status(200)
                .json({ success: true, message: "Logout berhasil." });
        });
    } catch (error) {
        console.error("Error saat logout:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.getSession = async (req, res) => {
    try {
        if (req.session.user) {
            const models = { Admin, Teacher, Student };
            const role = req.session.user.role;
            const Model = models[role.charAt(0).toUpperCase() + role.slice(1)];

            const userDoc = await Model.findById(req.session.user.id).select(
                "-password"
            );
            if (userDoc) {
                const user = userDoc.toJSON();
                user.role = role;
                return res.status(200).json({ success: true, user });
            }
        }
        return res
            .status(401)
            .json({ success: false, message: "Tidak ada sesi aktif." });
    } catch (error) {
        console.error("Error saat mengambil sesi:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email diperlukan." });
        }

        const models = [Admin, Teacher, Student];
        let userExistsInDB = false;

        for (const Model of models) {
            const user = await Model.findOne({ email });
            if (user) {
                userExistsInDB = true;
                break;
            }
        }

        if (userExistsInDB) {
            try {
                await firebaseAdmin.auth().generatePasswordResetLink(email);
            } catch (firebaseError) {
                if (firebaseError.code === "auth/user-not-found") {
                } else {
                    throw firebaseError;
                }
            }
        }

        res.status(200).json({
            message:
                "Jika akun dengan email tersebut terdaftar, tautan untuk mereset password telah dikirim.",
        });
    } catch (error) {
        console.error("Error pada proses lupa password:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
