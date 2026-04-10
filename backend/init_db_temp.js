const { initializeDatabase } = require('./src/config/database');
initializeDatabase()
  .then(() => {
    console.log('Database initialization successful');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
