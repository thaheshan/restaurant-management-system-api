const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT email, role, name FROM users')
  .then(r => { r.rows.forEach(x => console.log(x)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
