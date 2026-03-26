const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT name, quantity, reorder_level, stock_level FROM inventory')
  .then(r => { r.rows.forEach(x => console.log(x)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
