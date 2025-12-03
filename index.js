require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const lessonRecordRoutes = require('./routes/lessonRecordRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const rescheduleRoutes = require('./routes/rescheduleRoutes');
const teacherRoute = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const connectDB = require('./config/database');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// SETUP GOOGLE CLOUD STORAGE
const credentialGCS = require('./config/credentialGCS.json');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  credentials: credentialGCS,
  projectId: 'wisma-rapsodi-musik',
});

connectDB();

// 1. WAJIB DI VERCEL: Trust Proxy
// Karena Vercel ada di depan server kita, kita harus percaya proxy-nya
// agar cookie 'secure' bisa berjalan.
app.set('trust proxy', 1);

// 2. SETUP CORS
const corsOptions = {
  origin: [
    "https://wmr-frontend.vercel.app", 
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true, // Izinkan cookie/session
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// 3. TANGANI PREFLIGHT REQUEST (OPTIONS)
// Ini solusi untuk error "It does not have HTTP ok status"
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. SETUP SESSION
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Ubah ke false agar tidak nyepam session kosong
  proxy: true, // Wajib true di Vercel
  cookie: {
    secure: true, // Wajib true di Production (Vercel HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none' // Wajib 'none' untuk Cross-Origin (Frontend beda domain sama Backend)
  }
}));

// Setup Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/records', lessonRecordRoutes); 
app.use('/api/modules', moduleRoutes); 
app.use('/api/reschedule', rescheduleRoutes);
app.use('/api/teacher', teacherRoute);
app.use('/api/student', studentRoutes);
app.use('/api/assignments', assignmentRoutes);

app.get('/', (req, res) => {
  res.send('API Server Wisma Musik Rhapsodi is running!');
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["https://wmr-frontend.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (room) => { socket.join(room); });
  socket.on('leave-room', (room) => { socket.leave(room); });
  socket.on('disconnect', () => { });
});

socketService.initialize(io);
app.set('io', io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

// 5. WAJIB DI VERCEL: Export App
// Vercel butuh ini untuk mengubah app jadi Serverless Function
module.exports = app;