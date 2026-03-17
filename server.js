require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./src/config/db');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');


const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Render) so secure cookies work behind HTTPS
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Security & parsing middleware
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);


// Build the list of allowed origins from CORS_ORIGIN env var
const allowedOrigins = (() => {
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : [];
  // Always allow localhost for development
  return [
    ...envOrigins,
    'http://localhost:3000',
    'http://localhost:5000',
  ];
})();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any whitelisted origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In production, also mirror Render preview URLs
      if (origin.endsWith('.onrender.com')) return callback(null, true);
      // Fallback: allow (but log)
      console.warn(`CORS: unexpected origin ${origin}`);
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'anothersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
// Request logging (development)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', (req, _res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ---------------------------------------------------------------------------
// Health check — useful for Render and monitoring
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = require('./src/config/db');
    const conn = await pool.getConnection();
    // Test a basic query to ensure tables exist
    await conn.execute('SELECT 1 FROM products LIMIT 1');
    conn.release();
    return res.json({ alive: true, db: 'connected', tables: 'present', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health check DB error:', err.message);
    return res.status(503).json({ alive: false, db: 'disconnected/missing-tables', error: err.message, code: err.code });
  }
});

// ---------------------------------------------------------------------------
// Debug endpoint — ONLY FOR DEBUGGING FAILURES
// ---------------------------------------------------------------------------
app.get('/api/debug-db', async (_req, res) => {
  try {
    const { pool } = require('./src/config/db');
    const [rows] = await pool.execute('SHOW TABLES');
    return res.json({ success: true, tables: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/categories', require('./src/routes/categories.routes'));
app.use('/api/products', require('./src/routes/products.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api/contact', require('./src/routes/contact.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));

// ---------------------------------------------------------------------------
// View routes — serve HTML pages from the views directory
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home', 'index.html'));
});

app.get('/menu', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'menu', 'index.html'));
});

app.get('/menu/product', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'menu', 'product.html'));
});

app.get('/contact', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact', 'index.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});

app.get('/admin/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});

// All admin sub-routes serve the SPA dashboard
const adminDashboardSections = ['dashboard', 'products', 'categories', 'orders', 'messages', 'images', 'settings'];
adminDashboardSections.forEach((section) => {
  app.get(`/admin/${section}`, (_req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function start() {
  console.log(`[STARTUP] Initializing server. Timestamp: ${new Date().toISOString()}`);
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
