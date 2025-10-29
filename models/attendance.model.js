const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Menyimpan satu catatan absensi untuk satu sesi kelas yang spesifik.
 * Dibuat/diperbarui oleh guru.
 */
const attendanceSchema = new Schema({
  schedule: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  // Tanggal spesifik kelas ini diadakan
  date: {
    type: Date,
    required: true,
  },
  // Daftar absensi untuk setiap murid di kelas ini
  records: [
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
      },
      status: {
        type: String,
        enum: ['present', 'absent', 'excused'], // Hadir, Absen, Izin
        required: true,
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      }
    }
  ],
  // Jika kelas dibatalkan (oleh guru atau admin)
  isCancelled: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// Indeks untuk memastikan satu sesi kelas pada satu tanggal hanya punya satu catatan absensi
attendanceSchema.index({ schedule: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
