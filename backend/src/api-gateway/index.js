const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = require('./middleware/auth');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// ============ PUBLIC ROUTES (No Auth Required) ============

// Auth Service Routes - Public
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
}));

// Restaurant Service - Public (for QR scan, menu)
app.use('/api/restaurant/public', createProxyMiddleware({
  target: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/restaurant/public': '' },
}));

// ============ PROTECTED ROUTES (Auth Required) ============

// Verify token before protected routes
app.use('/api/orders', authMiddleware);
app.use('/api/inventory', authMiddleware);
app.use('/api/restaurant/admin', authMiddleware);
app.use('/api/hygiene', authMiddleware);

// Order Service
app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
}));

// Restaurant Service - Admin
app.use('/api/restaurant/admin', createProxyMiddleware({
  target: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/restaurant/admin': '/admin' },
}));

// Inventory Service
app.use('/api/inventory', createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/inventory': '' },
}));

// Hygiene Service
app.use('/api/hygiene', createProxyMiddleware({
  target: process.env.HYGIENE_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/hygiene': '' },
}));

// Error handling
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    error: 'Gateway error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
