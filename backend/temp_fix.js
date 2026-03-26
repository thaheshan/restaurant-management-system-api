const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  await pool.query("UPDATE inventory SET stock_level = CASE WHEN quantity <= 0 THEN 'critical' WHEN quantity <= reorder_level THEN 'low' ELSE 'normal' END");
  const r = await pool.query('SELECT name, quantity, reorder_level, stock_level FROM inventory');
  r.rows.forEach(x => console.log(x));
  pool.end();
}
fix().catch(e => { console.error(e.message); pool.end(); });
