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

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
app.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const otp = generateOTP();
    
    // Store OTP in Redis with 5-minute expiry
    await setAsync(`otp:${mobileNumber}`, otp, 300);

    // [DEMO MODE] Return OTP for testing
    console.log(`[DEMO] OTP for ${mobileNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      demo_otp: otp, // Remove in production
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and return JWT
app.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP required' });
    }

    // Get OTP from Redis
    const storedOtp = await getAsync(`otp:${mobileNumber}`);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Delete used OTP
    await deleteAsync(`otp:${mobileNumber}`);

    // Find or create user
    let result = await pool.query(
      'SELECT * FROM users WHERE mobile_number = $1',
      [mobileNumber]
    );

    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Create new user
      const userId = uuidv4();
      const createResult = await pool.query(
        'INSERT INTO users (id, mobile_number, role) VALUES ($1, $2, $3) RETURNING *',
        [userId, mobileNumber, 'customer']
      );
      user = createResult.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        mobileNumber: user.mobile_number,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Admin login (email/password)
app.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role IN ($2, $3)',
      [email, 'admin', 'chef']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
app.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});


// Register Admin
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    // Check if user already exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create restaurant first
    const restaurantId = uuidv4();
    await pool.query(
      'INSERT INTO restaurants (id, name) VALUES ($1, $2)',
      [restaurantId, `${name}s Restaurant`]
    );

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, mobile_number, role, restaurant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, name, email, password_hash, mobile || null, role || 'admin', restaurantId]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

