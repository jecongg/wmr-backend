const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonRecordSchema = new Schema({
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    schedule: { type: Schema.Types.ObjectId, ref: 'Schedule' }, // Opsional, jika les terjadwal
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true, default: 60 }, // dalam menit
    type: { type: String, enum: ['online', 'offline'], required: true },
    status: { type: String, enum: ['present', 'absent', 'excused', 'cancelled'], required: true },
    
    // Bagian Laporan
    materialsCovered: { type: String, trim: true },
    report: { type: String, trim: true },
    homework: { type: String, trim: true },
    
    // Lampiran (bukti foto/video)
    attachments: [{ type: String }], // Array of URLs

}, { timestamps: true });

module.exports = mongoose.model('LessonRecord', lessonRecordSchema);