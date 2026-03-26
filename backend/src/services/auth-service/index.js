const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../config/database');
const { getAsync, setAsync, deleteAsync } = require('../../config/redis');
require('dotenv').config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(express.json());

async function logActivity(restaurantId, userId, userName, userEmail, role, action, req) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    await pool.query(
      'INSERT INTO activity_logs (restaurant_id, user_id, user_name, user_email, role, action, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [restaurantId, userId, userName, userEmail, role, action, ip]
    );
  } catch (e) { console.error('Log error:', e.message); }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber || mobileNumber.length < 10) return res.status(400).json({ error: 'Invalid mobile number' });
    const otp = generateOTP();
    await setAsync(`otp:${mobileNumber}`, otp, 300);
    console.log(`[DEMO] OTP for ${mobileNumber}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully', demo_otp: otp });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) return res.status(400).json({ error: 'Mobile number and OTP required' });
    const storedOtp = await getAsync(`otp:${mobileNumber}`);
    if (!storedOtp || storedOtp !== otp) return res.status(400).json({ error: 'Invalid or expired OTP' });
    await deleteAsync(`otp:${mobileNumber}`);
    let result = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);
    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      const userId = uuidv4();
      const createResult = await pool.query(
        'INSERT INTO users (id, mobile_number, role) VALUES ($1, $2, $3) RETURNING *',
        [userId, mobileNumber, 'customer']
      );
      user = createResult.rows[0];
    }
    const token = jwt.sign(
      { userId: user.id, mobileNumber: user.mobile_number, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ success: true, token, user: { id: user.id, mobileNumber: user.mobile_number, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role IN ($2, $3)', [email, 'admin', 'chef']);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    await logActivity(user.restaurant_id, user.id, user.name, user.email, user.role, 'login', req);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role, restaurantId: user.restaurant_id } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        await logActivity(user.restaurant_id, user.id, user.name, user.email, user.role, 'logout', req);
      }
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (e) {
    res.json({ success: true, message: 'Logged out' });
  }
});

app.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const restaurantId = uuidv4();
    await pool.query('INSERT INTO restaurants (id, name) VALUES ($1, $2)', [restaurantId, `${name}s Restaurant`]);
    const result = await pool.query(
      'INSERT INTO users (id, name, email, password_hash, mobile_number, role, restaurant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, email, password_hash, mobile || null, role || 'admin', restaurantId]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.status(201).json({ success: true, message: 'Registration successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurant_id } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/logs/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 200 } = req.query;
    const result = await pool.query(
      'SELECT * FROM activity_logs WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT $2',
      [restaurantId, parseInt(limit)]
    );
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});


app.put('/update-profile', async (req, res) => {
  try {
    const { userId, name, email, mobileNumber } = req.body;
    console.log('update-profile called:', { userId, name, email, mobileNumber });
    if (!userId || !name || !email) return res.status(400).json({ error: 'userId, name and email are required' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already in use' });
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, mobile_number = COALESCE($3, mobile_number) WHERE id = $4 RETURNING id, name, email, mobile_number, role, restaurant_id',
      [name, email, mobileNumber || null, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Failed to update profile', detail: error.message });
  }
});

app.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) return res.status(400).json({ error: 'All fields are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.put('/update-restaurant', async (req, res) => {
  try {
    const { restaurantId, name, email, phone, address } = req.body;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId is required' });
    await pool.query(
      'UPDATE restaurants SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, restaurantId]
    );
    res.json({ success: true, message: 'Restaurant updated successfully' });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});