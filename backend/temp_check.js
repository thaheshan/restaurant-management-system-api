const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['inventory'])
  .then(r => { console.log('COLUMNS:', r.rows.map(x => x.column_name)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
