const { pool } = require('./src/config/database');
require('dotenv').config();

async function migrate() {
  try {
    console.log('Starting stock level migration...');
    
    // Update critical (0)
    const crit = await pool.query(
      "UPDATE inventory SET stock_level = 'critical' WHERE quantity <= 0"
    );
    console.log(`Updated ${crit.rowCount} items to critical.`);

    // Update low (0 < qty < 2)
    const low = await pool.query(
      "UPDATE inventory SET stock_level = 'low' WHERE quantity > 0 AND quantity < 2"
    );
    console.log(`Updated ${low.rowCount} items to low.`);

    // Update ok (qty >= 2)
    const ok = await pool.query(
      "UPDATE inventory SET stock_level = 'ok' WHERE quantity >= 2"
    );
    console.log(`Updated ${ok.rowCount} items to ok.`);

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
