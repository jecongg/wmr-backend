const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    default: null,
  },
  age:{
    type: Number,
    default: null,
  },
  gender:{
    type: String,
    default: null,
  },
  address:{
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: null,
  },
  photo: {
    type: String,
    default: null,
  },
  hourlyRate: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['invited', 'active', 'inactive'],
    default: 'invited',
  },
  authProvider: {
    type: String,
    default: null, // 'email' atau 'google'
  },
  authUid: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true, // Sertakan properti virtual saat di-serialize ke JSON
    transform: function(doc, ret) {
      delete ret._id; // Hapus _id
      delete ret.__v; // Hapus __v
    }
  },
  toObject: {
    virtuals: true, // Sertakan properti virtual saat diubah menjadi objek
     transform: function(doc, ret) {
      delete ret._id; // Hapus _id
      delete ret.__v; // Hapus __v
    }
  }
});

// Tambahkan virtual untuk 'id' yang mengacu ke _id
teacherSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Teacher', teacherSchema);