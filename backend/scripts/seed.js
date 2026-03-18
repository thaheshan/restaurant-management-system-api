const { pool } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database seed...');

    // Create restaurant
    const restaurantId = uuidv4();
    const adminUserId = uuidv4();

    // Hash admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    await client.query(
      `INSERT INTO users (id, email, name, password_hash, role, restaurant_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminUserId, 'admin@dinesmart.com', 'Admin User', hashedPassword, 'admin', restaurantId]
    );

    // Insert restaurant
    await client.query(
      `INSERT INTO restaurants (id, name, location, phone, email, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [restaurantId, 'DineSmart Restaurant', '123 Main St', '1234567890', 'restaurant@dinesmart.com', adminUserId]
    );

    // Insert categories
    const categories = [
      { name: 'Pasta', order: 1 },
      { name: 'Rice', order: 2 },
      { name: 'Burger', order: 3 },
      { name: 'Sushi Rolls', order: 4 },
      { name: 'Dessert', order: 5 },
      { name: 'Beverages', order: 6 },
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const id = uuidv4();
      categoryIds[cat.name] = id;
      await client.query(
        `INSERT INTO categories (id, restaurant_id, name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, restaurantId, cat.name, `${cat.name} dishes`, cat.order]
      );
    }

    // Insert menu items
    const menuItems = [
      {
        category: 'Pasta',
        name: 'Spaghetti Carbonara',
        price: 450,
        description: 'Classic Italian pasta with eggs and bacon',
      },
      {
        category: 'Rice',
        name: 'Chicken Biryani',
        price: 2000,
        description: 'Rice, chicken, onion, tomatoes, yogurt, salt, ginger, garlic, spices',
      },
      {
        category: 'Rice',
        name: 'Mixed Nasi Goreng',
        price: 3000,
        description: 'Rice, chicken, egg, prawns, mixed vegetables, oil, salt, spices',
      },
      {
        category: 'Burger',
        name: 'Classic Burger',
        price: 1500,
        description: 'Beef patty, lettuce, tomato, cheese, special sauce',
      },
      {
        category: 'Sushi Rolls',
        name: 'California Roll',
        price: 2500,
        description: 'Crab, avocado, cucumber, rice, nori',
      },
      {
        category: 'Dessert',
        name: 'Chocolate Cake',
        price: 800,
        description: 'Rich chocolate cake with cream',
      },
      {
        category: 'Beverages',
        name: 'Fresh Lemonade',
        price: 250,
        description: 'Fresh lemon juice with ice and sugar',
      },
    ];

    for (const item of menuItems) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, restaurantId, categoryIds[item.category], item.name, item.description, item.price]
      );
    }

    // Insert inventory items
    const inventoryItems = [
      { name: 'Chicken', category: 'meat', quantity: 15, unit: 'kg', expiryDate: '2025-04-15', status: 'fresh' },
      { name: 'Prawns', category: 'seafood', quantity: 8, unit: 'kg', expiryDate: '2025-02-20', status: 'warning' },
      { name: 'Carrots', category: 'vegetable', quantity: 20, unit: 'kg', expiryDate: '2025-03-30', status: 'fresh' },
      { name: 'Tomatoes', category: 'vegetable', quantity: 12, unit: 'kg', expiryDate: '2025-02-10', status: 'expired' },
      { name: 'Spices Mix', category: 'spice', quantity: 5, unit: 'kg', expiryDate: '2025-08-01', status: 'fresh' },
      { name: 'Beans', category: 'vegetable', quantity: 10, unit: 'kg', expiryDate: '2025-04-01', status: 'fresh' },
      { name: 'Ginger', category: 'spice', quantity: 2, unit: 'kg', expiryDate: '2025-02-28', status: 'warning' },
      { name: 'Garlic', category: 'spice', quantity: 3, unit: 'kg', expiryDate: '2025-03-15', status: 'fresh' },
      { name: 'Onions', category: 'vegetable', quantity: 50, unit: 'kg', expiryDate: '2025-03-20', status: 'fresh' },
    ];

    for (const item of inventoryItems) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO inventory (id, restaurant_id, name, category, quantity, unit, expiry_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, restaurantId, item.name, item.category, item.quantity, item.unit, item.expiryDate, item.status]
      );
    }

    // Insert certifications
    const certId = uuidv4();
    await client.query(
      `INSERT INTO certifications (id, restaurant_id, certification_name, certification_level, issue_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [certId, restaurantId, 'SL Certification', 'Standard License Level 4', '2025-01-12', '2026-01-12', 'valid']
    );

    // Insert sample sanitization logs
    const logId = uuidv4();
    await client.query(
      `INSERT INTO sanitization_logs (id, restaurant_id, session_type, employee_name, date_logged, time_logged, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, restaurantId, 'Surface Prep', 'Sunil', '2026-01-26', '11:30:00', 'verified']
    );

    console.log('Database seed completed successfully!');
    console.log(`Restaurant ID: ${restaurantId}`);
    console.log(`Admin User Email: admin@dinesmart.com`);
    console.log(`Admin Password: admin123`);
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
