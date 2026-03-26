const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
console.log('Comparing against:', sevenDaysLater);
pool.query('SELECT name, expiry_date FROM inventory WHERE restaurant_id = $1', ['35f2c4cc-3f75-4181-88e0-6733e4aba39e'])
  .then(r => {
    console.log('ALL ITEMS:');
    r.rows.forEach(x => console.log(x.name, String(x.expiry_date), 'match:', String(x.expiry_date) <= sevenDaysLater));
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });
