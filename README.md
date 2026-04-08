# SubsGeneral

Subscription marketplace with user accounts, admin panel, orders, payments, reviews, FAQs, tickets, and policy pages.

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- DB: SQLite (file)

## Monorepo Layout
- `frontend/` React app
- `backend/` Node/Express API

## Prerequisites
- Node.js 18+ (tested on Node 22)
- npm

## Backend Setup
1) Install dependencies
```bash
cd backend
npm install
```

2) Create `.env` in `backend/` (sample keys)
```env
PORT=4000
SQLITE_PATH=./subcheap.db
JWT_SECRET=change-me-please

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPassword123!

# SMTP (for reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=app_password_here
SMTP_FROM=you@gmail.com

# Payments (wallets)
HELEKET_WALLET=0x...
CRYPTOMOS_WALLET=0x...
BKASH_NUMBER=01XXXXXXXXX
NAGAD_NUMBER=01XXXXXXXXX

# Webhooks (optional, can be empty until domain is ready)
HELEKET_API_KEY=
HELEKET_WEBHOOK_URL=
CRYPTOMOS_API_KEY=
CRYPTOMOS_WEBHOOK_URL=

# Frontend URL (for reset link)
FRONTEND_URL=http://localhost:5173
```

3) Run backend
```bash
npm run dev
```

API should be at: `http://localhost:4000/api`

## Frontend Setup
1) Install dependencies
```bash
cd frontend
npm install
```

2) Set API base URL (in `frontend/src/App.jsx`)
```js
const API_URL = 'http://localhost:4000';
```

3) Run frontend
```bash
npm run dev
```

Frontend should be at: `http://localhost:5173`

## Build Frontend
```bash
cd frontend
npm run build
```
Output goes to `frontend/dist/`.

## Deploy (Netlify + HostTier)
### Backend on HostTier (Webuzo)
- Upload `backend/` to server.
- Ensure `uploads/` exists and is writable:
```bash
mkdir -p /home/youruser/backend/uploads
chmod 755 /home/youruser/backend/uploads
```
- Start command:
```
/usr/local/apps/nodejs22/bin/node /home/youruser/backend/server.js
```
- `PORT` must match the port configured in Webuzo.

### Frontend on Netlify
1) Set API URL in `frontend/src/App.jsx` to your backend domain:
```js
const API_URL = 'https://api.yourdomain.com';
```
2) Add SPA redirects:
`frontend/public/_redirects`
```
/*    /index.html   200
```
3) Build and deploy `frontend/dist/` to Netlify.

## Notes
- For production, use `https://api.yourdomain.com` for backend and keep frontend on Netlify.
- If you see `Unexpected token '<'`, it usually means the API URL is wrong or returning HTML.
