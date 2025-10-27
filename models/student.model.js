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
  phone_number: {
    type: String,
    default: null
  },
  age: {
    type: Number,
    required: true,
  },
  address: {
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
  parent_name: {
    type: String,
    default: null
  },
  parent_phone: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
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