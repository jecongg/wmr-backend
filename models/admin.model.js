const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
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
            match: [/.+\@.+\..+/, "Please fill a valid email address"],
        },
        authUid: {
            type: String,
            unique: true,
            sparse: true, // Memungkinkan nilai null tidak dianggap duplikat unik
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true, // Sertakan properti virtual saat di-serialize ke JSON
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

adminSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

module.exports = mongoose.model("Admin", adminSchema);
