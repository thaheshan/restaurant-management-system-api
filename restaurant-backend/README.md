 Nuvola Restaurant — Backend API

Node.js + Express + TypeScript + Prisma (SQLite dev / PostgreSQL prod)

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

## API Base URL
```
http://localhost:5000/api/v1
```

## Auth Endpoints
| Method | Endpoint            | Description         | Auth |
|--------|---------------------|---------------------|------|
| POST   | /auth/register      | Register new user   | ❌   |
| POST   | /auth/login         | Login               | ❌   |
| POST   | /auth/refresh       | Refresh tokens      | ❌   |
| POST   | /auth/logout        | Logout              | ❌   |
| GET    | /auth/me            | Current user        | ✅   |

## Menu Endpoints
| Method | Endpoint                      | Description          | Auth       |
|--------|-------------------------------|----------------------|------------|
| GET    | /menu                         | Get all menu items   | ❌         |
| GET    | /menu?category=main_course    | Filter by category   | ❌         |
| GET    | /menu?featured=true           | Get featured items   | ❌         |
| GET    | /menu?search=truffle          | Search menu          | ❌         |
| GET    | /menu/:id                     | Get single item      | ❌         |
| POST   | /menu                         | Create item          | Manager+   |
| PUT    | /menu/:id                     | Update item          | Manager+   |
| DELETE | /menu/:id                     | Delete item          | Manager+   |
| PATCH  | /menu/:id/toggle              | Toggle availability  | Manager+   |
| GET    | /menu/:id/reviews             | Get reviews          | ❌         |
| POST   | /menu/:id/reviews             | Add review           | Customer   |

## Order Endpoints
| Method | Endpoint            | Description          | Auth       |
|--------|---------------------|----------------------|------------|
| POST   | /orders             | Place order          | Optional   |
| GET    | /orders             | Get orders           | ✅         |
| GET    | /orders/stats       | Dashboard stats      | Manager+   |
| GET    | /orders/:id         | Get single order     | ✅         |
| PATCH  | /orders/:id/status  | Update status        | Staff      |

## Inventory Endpoints
| Method | Endpoint                  | Description      | Auth           |
|--------|---------------------------|------------------|----------------|
| GET    | /inventory                | Get all items    | Staff          |
| POST   | /inventory                | Add item         | Staff          |
| PUT    | /inventory/:id            | Update item      | Staff          |
| DELETE | /inventory/:id            | Delete item      | Manager+       |
| PATCH  | /inventory/:id/stock      | Update stock qty | Staff          |

## Demo Accounts
- **Admin:**   admin@nuvola.com   / admin123
- **Manager:** manager@nuvola.com / manager123
- **Customer:** guest@nuvola.com  / guest123

## Promo Codes
- `NUVOLA10` — 10% off
- `WELCOME20` — 20% off (expires 30 days)
