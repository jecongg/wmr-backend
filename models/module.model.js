const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moduleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true }, 
    type: { type: String, enum: ['file', 'link', 'video'], required: true },
    url: { type: String, required: true },
    fileName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);