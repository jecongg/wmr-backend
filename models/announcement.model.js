const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const announcementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    // Dibuat oleh Admin atau Guru
    createdBy: { type: Schema.Types.ObjectId, required: true, refPath: 'createdByType' },
    // createdByType: { type: String, required: true, enum: ['Admin', 'Teacher'] },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

announcementSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

module.exports = mongoose.model('Announcement', announcementSchema);