require('dotenv').config();
const { initializeDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Services
const authService = require('./services/auth-service/index.js');
const restaurantService = require('./services/restaurant-service/index.js');
const orderService = require('./services/order-service/index.js');
const inventoryService = require('./services/inventory-service/index.js');
const hygieneService = require('./services/hygiene-service/index.js');
const apiGateway = require('./api-gateway/index.js');

async function startServices() {
  try {
    console.log('Initializing DineSmart Backend...');

    // Initialize database
    console.log('Setting up database...');
    await initializeDatabase();

    // Connect to Redis
    console.log('Connecting to Redis...');
    await connectRedis();

    console.log('All services started successfully!');
    console.log('\nAPI Gateway: http://localhost:3000');
    console.log('Auth Service: http://localhost:3001');
    console.log('Restaurant Service: http://localhost:3002');
    console.log('Order Service: http://localhost:3003');
    console.log('Inventory Service: http://localhost:3004');
    console.log('Hygiene Service: http://localhost:3005');
  } catch (error) {
    console.error('Failed to start services:', error);
    process.exit(1);
  }
}

startServices();
