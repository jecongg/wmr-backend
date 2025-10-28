const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moduleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    category: { type: String, trim: true }, // Misal: Piano Grade 1, Teori Musik
    type: { type: String, enum: ['file', 'link', 'video'], required: true },
    url: { type: String, required: true }, // URL ke GCS, YouTube, atau link eksternal
    fileName: { type: String }, // Nama file asli jika tipenya 'file'
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);