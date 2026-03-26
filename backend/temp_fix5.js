const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  // Set reorder_level for existing items as a default of 2
  await pool.query("UPDATE inventory SET reorder_level = 2 WHERE reorder_level IS NULL");
  
  // Recalculate stock levels
  await pool.query("UPDATE inventory SET stock_level = 'critical' WHERE quantity <= 0");
  await pool.query("UPDATE inventory SET stock_level = 'low' WHERE quantity > 0 AND quantity <= reorder_level");
  await pool.query("UPDATE inventory SET stock_level = 'normal' WHERE quantity > reorder_level");

  const check = await pool.query('SELECT name, quantity, reorder_level, stock_level FROM inventory');
  check.rows.forEach(x => console.log(x));
  pool.end();
}
fix().catch(e => { console.error(e.message); pool.end(); });
