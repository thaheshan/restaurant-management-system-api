const { pool } = require('./backend/src/config/database');

async function alterDb() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;');
    console.log("Database altered successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error altering database:", error);
    process.exit(1);
  }
}

alterDb();
