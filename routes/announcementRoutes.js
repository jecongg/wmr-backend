const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

// Get all announcements
router.get('/', announcementController.ListAnnouncements);

// Create new announcement
router.post('/', announcementController.CreateAnnouncement);

// Delete announcement
router.delete('/:id', announcementController.DeleteAnnouncement);

module.exports = router;

