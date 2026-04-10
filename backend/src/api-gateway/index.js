const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();
const supabase = require('../config/supabase');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 8000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role", "x-restaurant-id"],
}));
app.options("*", cors());

const authMiddleware = require("./middleware/auth");

app.get("/health", (req, res) => {
  res.json({ status: "API Gateway is running" });
});

// PUBLIC - Auth logs (must be before /api/auth catch-all)
app.use("/api/auth/logs", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: { "^/api/auth/logs": "/logs" },
}));

// PUBLIC - Auth logout
app.use("/api/auth/logout", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: { "^/api/auth/logout": "/logout" },
}));

// PUBLIC - Auth (all other auth routes)
app.use("/api/auth", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "" },
}));

// PUBLIC - Restaurant
app.use("/api/restaurant/public", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { "^/api/restaurant/public": "/public" },
}));

// PROTECTED ROUTES
app.use("/api/orders", express.json(), authMiddleware);
app.use("/api/orders/restaurant", express.json(), authMiddleware);
app.use("/api/inventory", express.json(), authMiddleware);
app.use("/api/restaurant/admin", express.json(), authMiddleware);
app.use("/api/hygiene", express.json(), authMiddleware);

const forwardUser = (proxyReq, req) => {
  if (req.user) {
    proxyReq.setHeader("x-user-id", req.user.userId || "");
    proxyReq.setHeader("x-user-role", req.user.role || "");
    proxyReq.setHeader("x-restaurant-id", req.user.restaurantId || "");
  }
  if (req.body) {
    const body = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(body));
    proxyReq.write(body);
  }
};

app.use("/api/orders", createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true,
  pathRewrite: { "^/api/orders": "" },
  onProxyReq: forwardUser,
}));

app.use("/api/restaurant/admin", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { "^/api/restaurant/admin": "/admin" },
  onProxyReq: forwardUser,
}));

app.use("/api/inventory", createProxyMiddleware({
  target: "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { "^/api/inventory": "" },
  onProxyReq: forwardUser,
}));

app.use("/api/hygiene", createProxyMiddleware({
  target: "http://localhost:3005",
  changeOrigin: true,
  pathRewrite: { "^/api/hygiene": "" },
  onProxyReq: forwardUser,
}));

// ── IMAGE UPLOAD via Supabase Storage ──────────────────────────────────────
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

app.post('/api/upload/image', uploadMiddleware.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const bucket = req.query.bucket || 'menu-images';
    const folder = req.query.folder || 'uploads';
    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) {
      console.error('Supabase upload error:', error.message);
      return res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    return res.json({ success: true, url: urlData.publicUrl, path: filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Image upload failed', details: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error("Gateway Error:", err);
  res.status(500).json({ error: "Gateway error", message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log("API Gateway running on port " + PORT);
});