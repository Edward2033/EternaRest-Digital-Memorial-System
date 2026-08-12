require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Register ALL Mongoose models before any route loads
require('./models/index');

const app = express();

// Connect to MongoDB
connectDB();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Trust Render's proxy (required for rate-limit + correct IP detection)
app.set('trust proxy', 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const rawOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
]
  .filter(Boolean)
  .flatMap(s => s.split(','))
  .map(s => s.trim().replace(/\/$/, '')) // strip trailing slash
  .filter(Boolean);

const allowedOrigins = [...new Set(rawOrigins)];
console.log('✅ CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`⚠️  CORS blocked: ${origin}`);
    cb(null, false);
  },
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              10,               // max 10 login attempts per window
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging with body
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Core routes
app.use('/api/bookings',   require('./routes/bookingRoutes'));
app.use('/api/memorials',  require('./routes/memorialRoutes'));
app.use('/api/dashboard',  require('./routes/dashboardRoutes'));
app.use('/api/media',      require('./routes/mediaRoutes'));
app.use('/api/comments',   require('./routes/commentRoutes'));
app.use('/api/niches',     require('./routes/nicheRoutes'));
app.use('/api/family',     require('./routes/familyRoutes'));
app.use('/api/packages',   require('./routes/packageRoutes'));
app.use('/api/settings',   require('./routes/settingRoutes'));
app.use('/api/roles',      require('./routes/roleRoutes'));
app.use('/api/qr',         require('./routes/qrRoutes'));

// CMS image upload (admin auth inside route)
app.use('/api/upload',     require('./routes/uploadRoutes'));

// Public CMS (no auth)
app.use('/api/public',     require('./routes/publicRoutes'));

// Payments
app.use('/api/payments',   require('./routes/paymentRoutes'));

// Admin — login first (rate limited), then full CMS (same prefix, Express falls through correctly)
app.use('/api/admin/login', loginLimiter);
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/admin',      require('./routes/cmsRoutes'));

// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Serve memorial pages
app.get('/memorial/:bookingId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'memorial.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    mtn: {
      base_url:    process.env.MTN_BASE_URL || 'NOT SET',
      target_env:  process.env.MTN_TARGET_ENVIRONMENT || 'NOT SET',
      sub_key_len: (process.env.MTN_COLLECTION_PRIMARY_KEY || '').length,
      sub_key_prefix: (process.env.MTN_COLLECTION_PRIMARY_KEY || '').substring(0, 6) + '…',
      api_user_len: (process.env.MTN_API_USER || '').length,
      api_key_len:  (process.env.MTN_API_KEY  || '').length,
      sandbox:     process.env.MOMO_SANDBOX,
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
