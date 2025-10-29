const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Mendefinisikan jadwal kelas yang berulang.
 * Ini adalah 'template' untuk setiap sesi kelas.
 */
const scheduleSchema = new Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student',
  }],
  lesson: {
    type: String,
    required: true,
    trim: true,
  },
  // 0 = Minggu, 1 = Senin, 2 = Selasa, ... 6 = Sabtu
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  // Waktu mulai, misal: "14:00"
  time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu tidak valid (HH:MM)'],
  },
  // Durasi dalam menit
  duration: {
    type: Number,
    required: true,
    default: 60,
  },
  // Kelas online atau offline
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
