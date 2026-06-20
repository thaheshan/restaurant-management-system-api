const { Pool } = require('pg');

async function testConnection(url) {
  console.log(`Testing: ${url}`);
  const pool = new Pool({ connectionString: url });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success!', res.rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

async function run() {
  await testConnection('postgresql://postgres.snjfyouysterfmnbiolm:FathimaDinaSmart@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres');
  await testConnection('postgresql://postgres.snjfyouysterfmnbiolm:FathimaDinaSmart@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres');
  await testConnection('postgresql://postgres.snjfyouysterfmnbiolm:FathimaDinaSmart@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres');
  await testConnection('postgresql://postgres:FathimaDinaSmart@db.snjfyouysterfmnbiolm.supabase.co:5432/postgres');
}

run();
