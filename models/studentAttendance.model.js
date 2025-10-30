const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present',
    required: true
  },
  materialsCovered: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  homework: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
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

// Index untuk query yang efisien
studentAttendanceSchema.index({ teacher: 1, student: 1, date: -1 });
studentAttendanceSchema.index({ student: 1, date: -1 });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);

