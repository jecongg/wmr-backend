require('dotenv').config();

const express = require('express');
const cors = require('cors');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const connectDB = require('./config/database');

const app = express();
const credentialGCS = require('./config/credentialGCS.json');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  credentials: credentialGCS,
  projectId: 'wisma-rapsodi-musik',
});
const bucket = storage.bucket('wisma-rapsodi-musik');

connectDB();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/', (req, res) => {
  res.send('API Server Wisma Musik Rhapsodi is running!');
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});