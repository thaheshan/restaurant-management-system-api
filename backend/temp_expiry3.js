const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const today = new Date();
const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
console.log('today:', today.toISOString().split('T')[0]);
console.log('7 days later:', sevenDaysLater.toISOString().split('T')[0]);
pool.query('SELECT id, name, expiry_date FROM inventory WHERE restaurant_id =  AND expiry_date <=  ORDER BY expiry_date ASC', ['35f2c4cc-3f75-4181-88e0-6733e4aba39e', sevenDaysLater.toISOString().split('T')[0]])
  .then(r => { console.log('RESULTS:', r.rows.length); r.rows.forEach(x => console.log(x)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
