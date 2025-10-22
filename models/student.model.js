const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    default: null
  },
  authUid: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    default: null
  },
  parentName: {
    type: String,
    default: null
  },
  parentPhone: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'], // Sebaiknya gunakan enum untuk status
    default: 'active'
  }
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

module.exports = mongoose.model('Student', studentSchema);