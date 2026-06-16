require('dotenv').config();
const { Pool } = require('pg');

const sslConfig = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'verify-full') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Neon free tier needs up to 15s to wake from suspend
});

pool.on('error', (err) => console.error('DB pool error:', err.message));

pool.connect((err, client, release) => {
  if (err) console.error('❌ DB connection failed:', err.message);
  else { console.log('✅ PostgreSQL connected'); release(); }
});

module.exports = pool;
