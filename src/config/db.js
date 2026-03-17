const mysql = require('mysql2/promise');

let pool;
if (process.env.DATABASE_URL) {
  const uri = process.env.DATABASE_URL.trim();
  console.log('[DB] Initializing pool with DATABASE_URL');
  pool = mysql.createPool(uri);
} else {
  const host = process.env.DB_HOST ? process.env.DB_HOST.trim() : 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const database = process.env.DB_NAME ? process.env.DB_NAME.trim() : 'fork_n_cork';
  console.log(`[DB] Initializing pool with individual vars → ${host}:${port}/${database}`);
  
  pool = mysql.createPool({
    host,
    port,
    user: process.env.DB_USER ? process.env.DB_USER.trim() : 'root',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '',
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ...(host !== 'localhost' && host !== '127.0.0.1'
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });
}

/**
 * Test the DB connection with retry logic.
 * In production, logs the error but does NOT crash the server so that
 * Render doesn't enter a restart loop — the /api/health endpoint can
 * report the status instead.
 */
async function testConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.log(`[DB] MySQL connected successfully (attempt ${attempt})`);
      connection.release();
      return;
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        const delay = attempt * 2000; // 2s, 4s backoff
        console.log(`[DB] Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // All retries exhausted
  console.error('[DB] All connection attempts failed.');
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
  // In production, keep the server alive so the health endpoint can report the issue
  console.warn('[DB] Server will continue running with degraded DB connectivity.');
}

module.exports = { pool, testConnection };

