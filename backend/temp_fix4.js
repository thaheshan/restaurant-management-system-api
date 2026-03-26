const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const r1 = await pool.query("UPDATE inventory SET reorder_level = 5 WHERE LOWER(name) = 'chicken breast'");
  console.log('chicken breast updated rows:', r1.rowCount);
  
  const r2 = await pool.query("UPDATE inventory SET reorder_level = 10 WHERE LOWER(name) = 'tomatoes'");
  console.log('tomatoes updated rows:', r2.rowCount);

  const r3 = await pool.query("UPDATE inventory SET stock_level = 'critical' WHERE quantity <= 0");
  console.log('critical updated rows:', r3.rowCount);

  const r4 = await pool.query("UPDATE inventory SET stock_level = 'low' WHERE quantity > 0 AND reorder_level IS NOT NULL AND quantity <= reorder_level");
  console.log('low updated rows:', r4.rowCount);

  const r5 = await pool.query("UPDATE inventory SET stock_level = 'normal' WHERE quantity > reorder_level");
  console.log('normal updated rows:', r5.rowCount);

  const check = await pool.query('SELECT name, quantity, reorder_level, stock_level FROM inventory');
  check.rows.forEach(x => console.log(x));
  pool.end();
}
fix().catch(e => { console.error(e.message); pool.end(); });
