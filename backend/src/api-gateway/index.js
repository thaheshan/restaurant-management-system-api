const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

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

// PUBLIC - Auth
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
