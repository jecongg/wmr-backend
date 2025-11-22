const AssignMuridGuru = require('../models/assignMuridGuru.model');
const getUserIdFromRequest = (req) => req.user?.id;

exports.getAssignmentsByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { status } = req.query;

        const filter = { teacherId };
        filter.status = status || 'active';

        const assignments = await AssignMuridGuru.find(filter)
            .populate({
                path: 'studentId',
                select: 'name email phone_number age address parent_name parent_phone photo'
            })
            .sort({ createdAt: -1 });

        const studentsData = assignments.map(assignment => ({
            assignmentId: assignment.id,
            student: assignment.studentId,
            startDate: assignment.startDate,
            scheduleDay: assignment.scheduleDay,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            instrument: assignment.instrument,
            notes: assignment.notes,
            status: assignment.status
        }));
        res.status(200).json({
            success: true,
            count: studentsData.length,
            data: studentsData
        });

    } catch (error) {
        console.error('Error getting assignments by teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

exports.getActiveStudentAssignments = async (req, res) => {
    try {
        // Mengambil ID murid dari sesi yang sedang login
        const studentId = getUserIdFromRequest(req);
        if (!studentId) {
            return res.status(401).json({ message: "Otentikasi Gagal." });
        }

        const assignments = await AssignMuridGuru.find({
            studentId: studentId,
            status: 'active'
        }).populate({
            path: 'teacherId',
            select: 'name photo' // Ambil nama dan foto guru
        });

        // Di sini kita bisa langsung mengembalikan 'assignments' karena frontend
        // mungkin butuh semua detailnya. Tidak perlu di-map ulang jika tidak perlu.
        res.status(200).json(assignments);

    } catch (error) {
        console.error("Error fetching student assignments:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
