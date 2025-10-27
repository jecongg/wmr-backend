const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

router.get('/', announcementController.ListAnnouncements);

router.post('/', announcementController.CreateAnnouncement);

router.delete('/:id', announcementController.DeleteAnnouncement);

module.exports = router;

