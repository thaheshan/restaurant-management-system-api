const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.HYGIENE_SERVICE_PORT || 3005;

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

// Get certifications for restaurant
app.get('/restaurant/:restaurantId/certifications', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT id, certification_name, certification_level, issue_date, expiry_date, status
       FROM certifications
       WHERE restaurant_id = $1
       ORDER BY expiry_date DESC`,
      [restaurantId]
    );

    res.json({ success: true, certifications: result.rows });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Get sanitization logs
app.get('/restaurant/:restaurantId/sanitization-logs', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT id, session_type, employee_name, date_logged, time_logged, status, notes
       FROM sanitization_logs
       WHERE restaurant_id = $1
       ORDER BY date_logged DESC, time_logged DESC
       LIMIT 20`,
      [restaurantId]
    );

    res.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('Get sanitization logs error:', error);
    res.status(500).json({ error: 'Failed to fetch sanitization logs' });
  }
});

// Add sanitization log
app.post('/restaurant/:restaurantId/sanitization-log', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { sessionType, employeeId, employeeName, notes } = req.body;

    const id = uuidv4();
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];

    await pool.query(
      `INSERT INTO sanitization_logs (id, restaurant_id, session_type, employee_id, employee_name, date_logged, time_logged, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, restaurantId, sessionType, employeeId || null, employeeName, today, time, 'verified', notes || null]
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Add sanitization log error:', error);
    res.status(500).json({ error: 'Failed to add sanitization log' });
  }
});

// Add certification
app.post('/restaurant/:restaurantId/certification', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { certificationName, certificationLevel, issueDate, expiryDate, certificateNumber } = req.body;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO certifications (id, restaurant_id, certification_name, certification_level, issue_date, expiry_date, certificate_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, restaurantId, certificationName, certificationLevel, issueDate, expiryDate, certificateNumber, 'valid']
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// Get hygiene dashboard data
app.get('/restaurant/:restaurantId/dashboard', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const [certifications, logs] = await Promise.all([
      pool.query(
        `SELECT id, certification_name, certification_level, issue_date, expiry_date, status
         FROM certifications
         WHERE restaurant_id = $1
         ORDER BY expiry_date DESC`,
        [restaurantId]
      ),
      pool.query(
        `SELECT id, session_type, employee_name, date_logged, time_logged, status
         FROM sanitization_logs
         WHERE restaurant_id = $1
         ORDER BY date_logged DESC, time_logged DESC
         LIMIT 10`,
        [restaurantId]
      ),
    ]);

    res.json({
      success: true,
      dashboard: {
        certifications: certifications.rows,
        sanitizationLogs: logs.rows,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Hygiene Service running on port ${PORT}`);
});

