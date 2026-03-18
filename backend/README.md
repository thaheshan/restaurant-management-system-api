# DineSmart Backend - Node.js + Express

Complete microservices-based backend for the DineSmart restaurant management system with PostgreSQL and Redis.

## Architecture

```
API Gateway (Port 3000)
├── Auth Service (Port 3001) - OTP login, JWT
├── Restaurant Service (Port 3002) - Menu, Categories, QR codes
├── Order Service (Port 3003) - Orders, cart, tracking
├── Inventory Service (Port 3004) - Ingredients, expiry alerts
└── Hygiene Service (Port 3005) - Certifications, sanitization logs
```

## Prerequisites

- Node.js v18+
- Docker & Docker Compose
- npm v9+

## Quick Start

### 1. Setup Environment
```bash
cd backend
cp .env.example .env
```

### 2. Start Infrastructure
```bash
docker-compose up -d
```

Verify:
```bash
docker ps
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database & Seed Data
```bash
npm run seed
```

This creates:
- Database schema (all tables)
- Test restaurant with menu items
- Admin user (email: admin@dinesmart.com, password: admin123)
- Sample inventory and certifications

### 5. Start All Services
```bash
npm start
```

The API Gateway will be available at `http://localhost:3000`

## Services Overview

### Auth Service (Port 3001)

**Public Routes:**
- `POST /send-otp` - Send OTP to mobile number
  ```json
  { "mobileNumber": "9876543210" }
  ```

- `POST /verify-otp` - Verify OTP, get JWT token
  ```json
  { "mobileNumber": "9876543210", "otp": "123456" }
  ```

- `POST /admin-login` - Admin email/password login
  ```json
  { "email": "admin@dinesmart.com", "password": "admin123" }
  ```

### Restaurant Service (Port 3002)

**Public Routes:**
- `GET /api/restaurant/public/categories/:restaurantId` - Get all categories
- `GET /api/restaurant/public/category/:categoryId/items` - Get menu items
- `GET /api/restaurant/public/item/:itemId` - Get single item details
- `GET /api/restaurant/public/scan` - Get restaurant data by QR scan
  ```
  ?restaurantId=xxx&tableNumber=101
  ```

**Admin Routes (Protected):**
- `POST /api/restaurant/admin/generate-qr` - Generate table QR code
  ```json
  { "restaurantId": "xxx", "tableNumber": 101 }
  ```

- `GET /api/restaurant/admin/:restaurantId/qr-codes` - Get all QR codes
- `POST /api/restaurant/admin/menu-items` - Add menu item
- `POST /api/restaurant/admin/categories` - Add category

### Order Service (Port 3003)

**Protected Routes:**
- `POST /api/orders/place` - Place new order
  ```json
  {
    "restaurantId": "xxx",
    "tableNumber": 101,
    "items": [
      { "menuItemId": "xxx", "name": "Biryani", "quantity": 2, "price": 2000 }
    ],
    "paymentMethod": "cash"
  }
  ```

- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:orderId` - Get single order
- `PUT /api/orders/:orderId/status` - Update order status
  ```json
  { "status": "in_progress" }
  ```

- `GET /api/orders/restaurant/:restaurantId/orders` - Get restaurant's orders

### Inventory Service (Port 3004)

**Protected Routes:**
- `GET /api/inventory/restaurant/:restaurantId` - Get all ingredients
- `GET /api/inventory/restaurant/:restaurantId/expiry-alerts` - Get expiring items
- `POST /api/inventory/` - Add ingredient
  ```json
  {
    "restaurantId": "xxx",
    "name": "Chicken",
    "category": "meat",
    "quantity": 15,
    "unit": "kg",
    "expiryDate": "2025-04-15"
  }
  ```

- `PUT /api/inventory/:ingredientId` - Update ingredient
- `GET /api/inventory/restaurant/:restaurantId/stats` - Get inventory stats

### Hygiene Service (Port 3005)

**Protected Routes:**
- `GET /api/hygiene/restaurant/:restaurantId/certifications` - Get certifications
- `GET /api/hygiene/restaurant/:restaurantId/sanitization-logs` - Get logs
- `POST /api/hygiene/restaurant/:restaurantId/sanitization-log` - Add log
  ```json
  {
    "sessionType": "Surface Prep",
    "employeeName": "John Doe",
    "notes": "Cleaned all tables"
  }
  ```

- `POST /api/hygiene/restaurant/:restaurantId/certification` - Add certification
- `GET /api/hygiene/restaurant/:restaurantId/dashboard` - Get full dashboard

## Database Schema

### Users Table
```sql
- id (UUID)
- mobile_number (VARCHAR)
- email (VARCHAR)
- name (VARCHAR)
- password_hash (VARCHAR)
- role (customer, admin, chef, waiter)
- restaurant_id (UUID FK)
- created_at, updated_at
```

### Restaurants Table
```sql
- id (UUID)
- name (VARCHAR)
- location (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- admin_id (UUID FK -> users)
- created_at, updated_at
```

### Categories Table
```sql
- id (UUID)
- restaurant_id (UUID FK)
- name (VARCHAR) - Pasta, Rice, Burger, etc.
- description (TEXT)
- image_url (VARCHAR)
- display_order (INTEGER)
- created_at
```

### Menu Items Table
```sql
- id (UUID)
- restaurant_id (UUID FK)
- category_id (UUID FK)
- sub_category_id (UUID FK)
- name (VARCHAR)
- description (TEXT)
- ingredients (TEXT)
- price (DECIMAL)
- image_url (VARCHAR)
- is_available (BOOLEAN)
- is_discount (BOOLEAN)
- discount_percentage (DECIMAL)
- created_at, updated_at
```

### Orders Table
```sql
- id (UUID)
- user_id (UUID FK)
- restaurant_id (UUID FK)
- table_number (INTEGER)
- subtotal (DECIMAL)
- tax_fee (DECIMAL) - 10%
- grand_total (DECIMAL)
- payment_method (cash, debit_card, credit_card)
- payment_status (pending, completed, failed)
- order_status (order_placed, start_prep, in_progress, served)
- estimated_time (INTEGER)
- created_at, updated_at
```

### Order Items Table
```sql
- id (UUID)
- order_id (UUID FK)
- menu_item_id (UUID FK)
- name (VARCHAR)
- quantity (INTEGER)
- price (DECIMAL)
- created_at
```

### Inventory Table
```sql
- id (UUID)
- restaurant_id (UUID FK)
- name (VARCHAR)
- category (VARCHAR) - meat, seafood, vegetable, spice
- quantity (DECIMAL)
- unit (VARCHAR) - kg, liter, pieces
- expiry_date (DATE)
- status (fresh, warning, expired)
- stock_level (low, normal, high)
- created_at, updated_at
```

### Certifications Table
```sql
- id (UUID)
- restaurant_id (UUID FK)
- certification_name (VARCHAR)
- certification_level (VARCHAR)
- issue_date (DATE)
- expiry_date (DATE)
- certificate_number (VARCHAR)
- status (valid, expired)
- created_at
```

### Sanitization Logs Table
```sql
- id (UUID)
- restaurant_id (UUID FK)
- session_type (VARCHAR) - Surface Prep, Deep Clean, Tables Clean
- employee_id (UUID FK)
- employee_name (VARCHAR)
- date_logged (DATE)
- time_logged (TIME)
- status (verified, pending)
- notes (TEXT)
- created_at
```

## API Authentication

### Mobile Customer
1. Send OTP: `POST /api/auth/send-otp`
2. Verify OTP: `POST /api/auth/verify-otp`
3. Receive JWT token
4. Use token in header: `Authorization: Bearer {token}`

### Admin
1. Login: `POST /api/auth/admin-login`
2. Receive JWT token
3. Use token in header: `Authorization: Bearer {token}`

## Testing

### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "demo_otp": "123456"
}
```

### 2. Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"123456"}'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": "xxx", "mobileNumber": "9876543210" }
}
```

### 3. Get Menu
```bash
curl http://localhost:3000/api/restaurant/public/categories/restaurant-id
```

### 4. Place Order
```bash
curl -X POST http://localhost:3000/api/orders/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "restaurantId": "xxx",
    "tableNumber": 101,
    "items": [{"menuItemId": "xxx", "name": "Biryani", "quantity": 2, "price": 2000}],
    "paymentMethod": "cash"
  }'
```

## Demo Credentials

### Admin
- Email: `admin@dinesmart.com`
- Password: `admin123`

### Customer
- Mobile: Any 10-digit number
- OTP: Returned in response (demo mode)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiration time (e.g., 7d) |
| `API_GATEWAY_PORT` | Gateway port (default: 3000) |
| `AUTH_SERVICE_PORT` | Auth service port (default: 3001) |
| `RESTAURANT_SERVICE_PORT` | Restaurant service port (default: 3002) |
| `ORDER_SERVICE_PORT` | Order service port (default: 3003) |
| `INVENTORY_SERVICE_PORT` | Inventory service port (default: 3004) |
| `HYGIENE_SERVICE_PORT` | Hygiene service port (default: 3005) |

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs dinesmart-postgres
```

### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# View logs
docker logs dinesmart-redis
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Production Deployment

1. Change `JWT_SECRET` in `.env`
2. Use secure database credentials
3. Remove `demo_otp` from auth responses
4. Enable HTTPS
5. Setup proper error logging
6. Use environment-specific configs

## Support

For issues, check logs:
```bash
docker logs dinesmart-postgres
docker logs dinesmart-redis
```

## License

ISC
