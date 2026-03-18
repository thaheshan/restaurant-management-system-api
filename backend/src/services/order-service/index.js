const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;

app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  // User info attached by gateway
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Place order
app.post('/place', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, tableNumber, items, paymentMethod, promoCode } = req.body;
    const userId = req.user?.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const taxFee = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
    let grandTotal = subtotal + taxFee;

    // Apply promo code if provided
    if (promoCode) {
      const promoResult = await pool.query(
        'SELECT * FROM promo_codes WHERE code = $1 AND is_active = true',
        [promoCode]
      );

      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];
        if (promo.discount_percentage) {
          grandTotal = Math.round(grandTotal * (1 - promo.discount_percentage / 100) * 100) / 100;
        }
      }
    }

    // Create order
    const orderId = uuidv4();
    const orderResult = await pool.query(
      `INSERT INTO orders (id, user_id, restaurant_id, table_number, subtotal, tax_fee, grand_total, payment_method, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderId, userId, restaurantId, tableNumber, subtotal, taxFee, grandTotal, paymentMethod, 'order_placed']
    );

    // Add order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), orderId, item.menuItemId, item.name, item.quantity, item.price]
      );
    }

    // Fetch complete order with items
    const completeOrder = await pool.query(
      `SELECT o.*, json_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'price', oi.price)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    res.json({ success: true, order: completeOrder.rows[0] });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get user's orders
app.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'price', oi.price)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
app.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'price', oi.price)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin/restaurant)
app.put('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Valid statuses
    const validStatuses = ['order_placed', 'start_prep', 'in_progress', 'served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE orders SET order_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get restaurant's orders
app.get('/restaurant/:restaurantId/orders', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'price', oi.price)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.restaurant_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [restaurantId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
