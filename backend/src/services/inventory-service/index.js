const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.INVENTORY_SERVICE_PORT || 3004;

app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  const restaurantId = req.headers["x-restaurant-id"];
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = { userId, role, restaurantId };
  next();
};

// Get inventory for restaurant
app.get('/restaurant/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT id, name, category, quantity, unit, expiry_date, status, stock_level
       FROM inventory
       WHERE restaurant_id = $1
       ORDER BY name ASC`,
      [restaurantId]
    );

    res.json({ success: true, inventory: result.rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get expiry alerts
app.get('/restaurant/:restaurantId/expiry-alerts', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT id, name, category, expiry_date, status
       FROM inventory
       WHERE restaurant_id = $1
       AND expiry_date BETWEEN $2 AND $3
       ORDER BY expiry_date ASC`,
      [restaurantId, today.toISOString().split('T')[0], threeDaysLater.toISOString().split('T')[0]]
    );

    res.json({ success: true, expiringItems: result.rows });
  } catch (error) {
    console.error('Get expiry alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch expiry alerts' });
  }
});

// Add ingredient
app.post('/', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, name, category, quantity, unit, expiryDate } = req.body;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO inventory (id, restaurant_id, name, category, quantity, unit, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, restaurantId, name, category, quantity, unit, expiryDate, 'fresh']
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Add ingredient error:', error);
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

// Update ingredient
app.put('/:ingredientId', authMiddleware, async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { quantity, expiryDate, status } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }

    if (expiryDate) {
      updates.push(`expiry_date = $${paramCount++}`);
      values.push(expiryDate);
    }

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(ingredientId);

    const query = `UPDATE inventory SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ success: true, ingredient: result.rows[0] });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Get dashboard stats
app.get('/restaurant/:restaurantId/stats', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const [totalItems, expiringItems, lowStockItems] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM inventory WHERE restaurant_id = $1', [restaurantId]),
      pool.query(`
        SELECT COUNT(*) as count FROM inventory
        WHERE restaurant_id = $1 AND status IN ('warning', 'expired')
      `, [restaurantId]),
      pool.query(`
        SELECT COUNT(*) as count FROM inventory
        WHERE restaurant_id = $1 AND stock_level = 'low'
      `, [restaurantId]),
    ]);

    res.json({
      success: true,
      stats: {
        totalItems: totalItems.rows[0].count,
        expiringItems: expiringItems.rows[0].count,
        lowStockItems: lowStockItems.rows[0].count,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
});

