const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rescheduleRequestSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    
    // --- PERUBAHAN DI SINI ---
    // Menggantikan originalSchedule dengan referensi ke assignment
    assignment: { type: Schema.Types.ObjectId, ref: 'AssignMuridGuru', required: true }, 
    
    // Tanggal spesifik dari jadwal asli yang ingin diubah (misal: Selasa, 5 Nov 2024)
    originalDate: { type: Date, required: true }, 
    
    requestedDate: { type: Date, required: true },
    requestedTime: { type: String, required: true },
    reason: { type: String, required: true },
    
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    teacherComment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RescheduleRequest', rescheduleRequestSchema);