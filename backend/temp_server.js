const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

app.get('/test-expiry', async (req, res) => {
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const r = await pool.query(
    "SELECT name, expiry_date FROM inventory WHERE restaurant_id = $1 AND expiry_date AT TIME ZONE 'UTC' <= $2",
    ['35f2c4cc-3f75-4181-88e0-6733e4aba39e', sevenDaysLater]
  );
  res.json(r.rows);
});

app.listen(9999, () => console.log('Test server on 9999'));
