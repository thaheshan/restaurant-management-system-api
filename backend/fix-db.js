const { pool } = require("./src/config/database");
require("dotenv").config();

async function fix() {
  await pool.query("ALTER TABLE table_qrs ALTER COLUMN qr_code TYPE TEXT");
  await pool.query("ALTER TABLE table_qrs ALTER COLUMN qr_data TYPE TEXT");
  console.log("Fixed! Column types updated to TEXT");
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
