const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const dotenv  = require('dotenv');

dotenv.config();

// Auto-migrate: add asset_url and storage_path to profile_assets if not present
// Safe to run on every deploy — uses IF NOT EXISTS / DROP NOT NULL is idempotent
const prisma = require('./lib/prisma');
prisma.$executeRawUnsafe(`ALTER TABLE profile_assets ADD COLUMN IF NOT EXISTS asset_url TEXT`)
  .then(() => prisma.$executeRawUnsafe(`ALTER TABLE profile_assets ADD COLUMN IF NOT EXISTS storage_path TEXT`))
  .then(() => prisma.$executeRawUnsafe(`ALTER TABLE profile_assets ALTER COLUMN file_data DROP NOT NULL`))
  .then(() => console.log('[Migration] profile_assets columns up to date'))
  .catch(e => console.warn('[Migration] profile_assets migration skipped:', e.message));

const app = express();

// Allow both production frontend and localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://insomnia-roan.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return cb(null, true);
    // In production allow the configured frontend; in dev allow all localhost
    if (allowedOrigins.some(o => origin.startsWith(o) || origin === o)) return cb(null, true);
    // Also allow any vercel preview deployments
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Dev-only: clear interview data for testing ────────────────────────────────
// DELETE /dev/clear-interviews  — remove after testing
if (process.env.NODE_ENV !== 'production') {
  const prisma = require('./lib/prisma');
  app.delete('/dev/clear-interviews', async (req, res) => {
    try {
      const [sf, ir, notif, ireq] = await Promise.all([
        prisma.sessionFeedback.deleteMany({}),
        prisma.interviewRecord.deleteMany({}),
        prisma.notification.deleteMany({}),
        prisma.interviewRequest.deleteMany({}),
      ]);
      res.json({
        message: 'Cleared',
        session_feedbacks: sf.count,
        interview_records: ir.count,
        notifications: notif.count,
        interview_requests: ireq.count,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

// ── Routes (mounted at root, no /api prefix) ──────────────────────────────────
app.use('/auth',          require('./routes/auth'));
app.use('/auth/google',   require('./routes/google'));
app.use('/ai',            require('./routes/aiRoutes'));
app.use('/requests',      require('./routes/requests'));
app.use('/notifications', require('./routes/notifications'));
app.use('/users',         require('./routes/users'));
app.use('/alumni',        require('./routes/alumni'));
app.use('/register',      require('./routes/register')); // Bulk upload endpoints
app.use('/stats',         require('./routes/stats'));
app.use('/chat',          require('./routes/chat'));
app.use('/meet',          require('./routes/meetRoutes'));
app.use('/interview-records', require('./routes/interviewRecords')); // Alumni ratings
app.use('/feedback',          require('./routes/feedback'));          // Session feedback
app.use('/activity-logs',     require('./routes/activityLogs'));      // Activity feed data
app.use('/platform-config',   require('./routes/platformConfig'));    // Platform configuration
app.use('/profile-assets',    require('./routes/profileAssets'));     // Profile photos & resumes
app.use('/push',              require('./routes/push'));              // Web push subscriptions

// ── Socket.io ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.some(o => origin.startsWith(o) || origin === o)) return cb(null, true);
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      cb(new Error(`Socket CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});
require('./socket/interviewRoom')(io);
require('./socket/notificationHandler')(io);
const { startReminderService } = require('./services/reminderService');
startReminderService(io);
require('./services/mentorshipCron');

app.set('io', io);

// ── Health & info ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AlumNEX Backend is running' });
});

app.get('/', (req, res) => {
  res.json({
    name: 'AlumNEX AI API',
    version: '2.0.0',
    database: 'Supabase (PostgreSQL)',
    routes: [
      'GET  /health',
      'GET  /alumni',
      'POST /auth/student/login',
      'POST /auth/alumni/login',
      'POST /auth/tnp/login',
      'POST /register/bulk-students',
      'POST /register/bulk-alumni',
      'GET  /register/template/students',
      'GET  /register/template/alumni',
      'POST /ai/resume-analyze',
      'POST /ai/interview-analytics',
      'POST /ai/profile-strength',
      'GET  /requests?alumniId=&studentId=',
      'POST /requests',
      'PATCH /requests/:id',
      'GET  /notifications?userId=',
      'PATCH /notifications/read',
      'GET  /users/:id',
      'GET  /users/by-email/:email',
      'PATCH /users/:id/profile',
      'GET  /stats/platform',
      'GET  /stats/interviews?userId=',
      'GET  /stats/mentorship',
      'GET  /stats/directory',
      'GET  /stats/directory/user/:id',
      'GET  /stats/recent-activity',
      'PATCH /interview-records/:id',
      'POST /chat/interview',
      'POST /chat/questions',
      'POST /meet/create',
      'GET  /meet/:roomId',
      'POST /meet/custom',
      'POST /meet/validate',
    ],
  });
});

const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.PORT) {
  throw new Error('Missing required PORT environment variable in production');
}

server.on('error', err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  const baseUrl = isProduction ? `https://alumnex2-0.onrender.com` : `http://localhost:${PORT}`;
  console.log(`\n🚀 AlumNEX Backend running on ${baseUrl}`);
  console.log(`📡 Socket.io ready on ${baseUrl.replace('http', 'ws')}/interview`);
  console.log(`🗄️  Database: Supabase (PostgreSQL)`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? '✅ connected' : '❌ missing key'}\n`);
});
