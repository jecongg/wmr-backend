// WMR-BACKEND/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.model'); // Pastikan path benar ke model teacher Anda

// Rute untuk mendapatkan semua guru
// Ini akan sesuai dengan api.get('/api/teachers') di frontend Anda
router.get('/', async (req, res) => {
    try {
        const teachers = await Teacher.find({}); // Mengambil semua guru dari database
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: 'Server error saat mengambil data guru.' });
    }
});

// Anda juga akan menempatkan rute untuk GET satu guru, PUT (update), dan DELETE di sini
// Contoh untuk update:
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTeacher = await Teacher.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedTeacher) {
            return res.status(404).json({ message: 'Guru tidak ditemukan.' });
        }
        res.status(200).json(updatedTeacher);
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ message: 'Server error saat memperbarui data guru.' });
    }
});

// Contoh untuk delete:
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTeacher = await Teacher.findByIdAndDelete(id);
        if (!deletedTeacher) {
            return res.status(404).json({ message: 'Guru tidak ditemukan.' });
        }
        res.status(200).json({ message: 'Guru berhasil dihapus.' });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ message: 'Server error saat menghapus data guru.' });
    }
});


module.exports = router;