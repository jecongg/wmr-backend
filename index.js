require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const lessonRecordRoutes = require('./routes/lessonRecordRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const rescheduleRoutes = require('./routes/rescheduleRoutes');
const teacherRoute = require('./routes/teacherRoutes')
const studentRoutes = require('./routes/studentRoutes')
const assignmentRoutes = require('./routes/assignmentRoutes')
const connectDB = require('./config/database');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const credentialGCS = require('./config/credentialGCS.json');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  credentials: credentialGCS,
  projectId: 'wisma-rapsodi-musik',
});

connectDB();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/records', lessonRecordRoutes); 
app.use('/api/modules', moduleRoutes); 
app.use('/api/reschedule', rescheduleRoutes);
app.use('/api/teacher', teacherRoute)
app.use('/api/student', studentRoutes)
app.use('/api/assignments', assignmentRoutes);

app.get('/', (req, res) => {
  res.send('API Server Wisma Musik Rhapsodi is running!');
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('leave-room', (room) => {
    socket.leave(room);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
  });
});

socketService.initialize(io);

app.set('io', io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log(`WebSocket server is ready`);
});