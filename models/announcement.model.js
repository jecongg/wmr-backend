const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true, 
            transform: function (doc, ret) {
                delete ret._id; // Hapus _id
                delete ret.__v; // Hapus __v
            },
        },
        toObject: {
            virtuals: true, // Sertakan properti virtual saat diubah menjadi objek
            transform: function (doc, ret) {
                delete ret._id; // Hapus _id
                delete ret.__v; // Hapus __v
            },
        },
    }
);

module.exports = mongoose.model("Announcement", announcementSchema);
