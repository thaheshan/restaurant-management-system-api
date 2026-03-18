const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.RESTAURANT_SERVICE_PORT || 3002;

app.use(express.json());

// Get all categories by restaurant
app.get('/public/categories/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, image_url, display_order
       FROM categories
       WHERE restaurant_id = $1
       ORDER BY display_order ASC`,
      [restaurantId]
    );

    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get menu items by category
app.get('/public/category/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, ingredients, price, image_url, is_discount, discount_percentage
       FROM menu_items
       WHERE category_id = $1 AND is_available = true
       ORDER BY name ASC`,
      [categoryId]
    );

    res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item details
app.get('/public/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const result = await pool.query(
      `SELECT * FROM menu_items WHERE id = $1`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Get restaurant data by QR scan
app.get('/public/scan', async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.query;

    const restaurantResult = await pool.query(
      `SELECT id, name, location, phone, email FROM restaurants WHERE id = $1`,
      [restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const categoriesResult = await pool.query(
      `SELECT id, name, description, image_url FROM categories
       WHERE restaurant_id = $1 ORDER BY display_order`,
      [restaurantId]
    );

    const restaurant = restaurantResult.rows[0];
    res.json({
      success: true,
      restaurant,
      categories: categoriesResult.rows,
      tableNumber,
    });
  } catch (error) {
    console.error('Get restaurant by scan error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant data' });
  }
});

// ============ ADMIN ROUTES (Protected) ============

// Generate QR code for table
app.post('/admin/generate-qr', async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.body;

    const qrPayload = JSON.stringify({
      restaurantId,
      tableNumber,
      timestamp: Date.now(),
    });

    // Generate QR code as base64
    const qrCodeDataURL = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#2B7C4F', light: '#FFFFFF' },
    });

    // Save to database
    const qrId = uuidv4();
    await pool.query(
      `INSERT INTO table_qrs (id, restaurant_id, table_number, qr_code, qr_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [qrId, restaurantId, tableNumber, qrCodeDataURL, qrPayload]
    );

    res.json({ success: true, qrCode: qrCodeDataURL, qrId });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Get all QR codes for restaurant
app.get('/admin/:restaurantId/qr-codes', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT id, table_number, qr_code FROM table_qrs
       WHERE restaurant_id = $1 ORDER BY table_number`,
      [restaurantId]
    );

    res.json({ success: true, qrCodes: result.rows });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// Add menu item
app.post('/admin/menu-items', async (req, res) => {
  try {
    const { restaurantId, categoryId, name, description, ingredients, price, imageUrl } = req.body;

    const itemId = uuidv4();
    await pool.query(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, ingredients, price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [itemId, restaurantId, categoryId, name, description, ingredients, price, imageUrl]
    );

    res.json({ success: true, itemId });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Add category
app.post('/admin/categories', async (req, res) => {
  try {
    const { restaurantId, name, description, imageUrl } = req.body;

    const categoryId = uuidv4();
    await pool.query(
      `INSERT INTO categories (id, restaurant_id, name, description, image_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [categoryId, restaurantId, name, description, imageUrl]
    );

    res.json({ success: true, categoryId });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.listen(PORT, () => {
  console.log(`Restaurant Service running on port ${PORT}`);
});
