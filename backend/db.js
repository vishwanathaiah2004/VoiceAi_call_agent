require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('DB pool error:', err.message));

pool.connect((err, client, release) => {
  if (err) console.error('❌ DB connection failed:', err.message);
  else { console.log('✅ PostgreSQL connected'); release(); }
});

module.exports = pool;
