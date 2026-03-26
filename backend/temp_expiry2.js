const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT * FROM inventory WHERE expiry_date IS NOT NULL ORDER BY expiry_date ASC')
  .then(r => { console.log('COUNT:', r.rows.length); console.log('SAMPLE:', JSON.stringify(r.rows[0])); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
