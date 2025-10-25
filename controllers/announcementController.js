import Announcement from '../models/announcement.model.js';

exports.ListAnnouncements = async (req,res) => {
    try{
        const fetchAnnouncement = await Announcement.find()
        console.log(fetchAnnouncement);
    }catch(error){
        return res.status(500).json({message: 'Terjadi kesalahan pada server.'});
    }
}