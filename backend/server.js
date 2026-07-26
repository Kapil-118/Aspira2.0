require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { socketHandler } = require('./socket/socketHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Initialize Express App
const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    callback(null, true);
  } else {
    callback(null, true);
  }
};

// Initialize Socket.IO Server
const io = socketio(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Bind Socket IO events
socketHandler(io);

// Connect to Database
connectDB();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows hosting static images without security block
}));

app.use(cors({
  origin: corsOriginHandler,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use('/api/', apiLimiter);

// Serve local uploads folder statically
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Import Route modules
const authRoutes = require('./routes/authRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const aiRoutes = require('./routes/aiRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const placementRoutes = require('./routes/placementRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const pushRoutes = require('./routes/pushRoutes');

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/push', pushRoutes);

// Base Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Aspira API Server is running successfully!' });
});

// Express Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server executing in production mode on port ${PORT}`);
});
