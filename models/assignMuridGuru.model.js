const mongoose = require('mongoose');

const assignMuridGuruSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive',],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  scheduleDay: {
    type: String,
    enum: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    default: null
  },
  startTime: {
    type: String,
    default: null
  },
  endTime: {
    type: String,
    default: null 
  },
  instrument: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
}, {
  timestamps: true,
  collection: 'assign_murid_guru', // Nama collection di MongoDB
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
    }
  }
});

// Index untuk mencegah duplikasi assignment yang aktif
assignMuridGuruSchema.index({ teacherId: 1, studentId: 1, status: 1 });

// Virtual untuk populate data teacher dan student
assignMuridGuruSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

assignMuridGuruSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

assignMuridGuruSchema.virtual('admin', {
  ref: 'Admin',
  localField: 'assignedBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('AssignMuridGuru', assignMuridGuruSchema);

