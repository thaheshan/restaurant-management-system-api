# 🚀 DineSmart Backend - Startup Guide

## ONE-COMMAND STARTUP (Recommended)

```bash
cd backend

# Step 1: Start Docker containers
docker-compose up -d

# Step 2: Install dependencies
npm install

# Step 3: Initialize database & seed
npm run seed

# Step 4: Start all services
npm start
```

**Done!** Your backend is running on `http://localhost:3000`

---

## 📊 What Each Service Does

```
API Gateway (3000) ← Your apps connect here
├── Auth Service (3001)        → Login, OTP, JWT
├── Restaurant Service (3002)  → Menu, QR codes
├── Order Service (3003)       → Orders, payment
├── Inventory Service (3004)   → Stock, expiry
└── Hygiene Service (3005)     → Certifications
```

---

## 🔑 Demo Credentials

**Admin Login:**
```
Email: admin@dinesmart.com
Password: admin123
```

**Customer Login:**
```
Any 10-digit mobile number (e.g., 9876543210)
OTP: Shown in response (demo mode)
```

---

## 📱 Connect Your Apps

### Mobile App
Set base URL to: `http://localhost:3000/api`

### Web Dashboard
Set base URL to: `http://localhost:3000/api`

---

## ✅ Verify Everything Works

```bash
# Test API Gateway
curl http://localhost:3000/health

# Test Auth Service
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# Test Database
docker exec -it dinesmart-postgres psql -U postgres -d dinesmart -c "SELECT COUNT(*) FROM restaurants;"
```

---

## 🐳 Docker Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker logs dinesmart-postgres
docker logs dinesmart-redis

# Reset everything
docker-compose down -v
docker-compose up -d
npm run seed
```

---

## 📚 Documentation

- **README.md** - Quick reference & API endpoints
- **BACKEND_INTEGRATION_GUIDE.md** - Complete integration guide
- **BACKEND_DELIVERY_SUMMARY.md** - What was created

---

## 🔍 Database Schema

12 tables created automatically:
- users, restaurants, categories, menu_items
- orders, order_items
- inventory
- certifications, sanitization_logs
- table_qrs, promo_codes
- sub_categories

---

## 🆘 Troubleshooting

**Port in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database won't connect?**
```bash
docker logs dinesmart-postgres
```

**Need to reset?**
```bash
docker-compose down -v
docker-compose up -d
npm run seed
npm start
```

---

## 📌 Important Files

```
backend/
├── src/api-gateway/index.js          ← Modify ports here
├── src/services/*/index.js           ← Service logic
├── src/db/schema.sql                 ← Database structure
├── src/config/database.js            ← Database connection
├── scripts/seed.js                   ← Demo data
└── .env                              ← Configuration
```

---

## 🎯 Quick Feature Matrix

| Feature | Service | Endpoint |
|---------|---------|----------|
| Mobile Login | Auth | POST /auth/send-otp |
| Admin Login | Auth | POST /auth/admin-login |
| Menu Categories | Restaurant | GET /restaurant/public/categories |
| QR Code | Restaurant | POST /restaurant/admin/generate-qr |
| Place Order | Order | POST /orders/place |
| Order Tracking | Order | GET /orders/:orderId |
| Inventory | Inventory | GET /inventory/restaurant/:id |
| Expiry Alerts | Inventory | GET /inventory/restaurant/:id/expiry-alerts |
| Certifications | Hygiene | GET /hygiene/restaurant/:id/certifications |
| Sanitization | Hygiene | POST /hygiene/restaurant/:id/sanitization-log |

---

## 🚢 Production Deployment

Before deploying:
1. Change JWT_SECRET in .env
2. Use production database
3. Remove demo_otp from responses
4. Enable HTTPS
5. Setup monitoring

---

## 📞 Need Help?

1. Check logs: `docker logs dinesmart-postgres`
2. Read README.md in backend folder
3. See BACKEND_INTEGRATION_GUIDE.md for detailed endpoints
4. Check BACKEND_DELIVERY_SUMMARY.md for system overview

---

**Your backend is ready to power DineSmart! 🎉**

For full API documentation, see `README.md`
