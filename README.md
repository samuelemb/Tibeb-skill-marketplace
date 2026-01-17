# Tibeb v1.1

Freelance marketplace with a **Node.js/Express backend** and a **Next.js frontend**.

---

## Project Structure

* `backend/` — Node.js + Express API (Prisma + PostgreSQL)
* `frontend/` — Next.js App Router frontend 

---

## Requirements

* Node.js 18+
* PostgreSQL 14+

---

## Backend Setup

### 1) Configure environment

Copy `backend/.env.example` to `backend/.env` and set:

* `DATABASE_URL`
* `JWT_SECRET`
* `FRONTEND_URL`
* `RESEND_API_KEY` (optional)
* `ADMIN_CREATE_SECRET`

### 2) Install dependencies

```
cd backend
npm install
```

### 3) Run migrations

```
npx prisma migrate deploy
npx prisma generate
```

### 4) Start backend

```
npm run dev
```

API Docs:

```
http://localhost:5000/api-docs
```

---

## Frontend Setup

### 1) Configure environment

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2) Install dependencies

```
cd frontend
npm install
```

### 3) Start frontend

```
npm run dev
```

App:

```
http://localhost:3000
```

---

## Admin Creation

Create an admin user using the secret header:

```
curl -X POST http://localhost:5000/api/admin/create ^
  -H "Content-Type: application/json" ^
  -H "x-admin-secret: your-secret" ^
  -d "{\"email\":\"admin@tibeb.shop\",\"password\":\"StrongPass123\",\"firstName\":\"Admin\",\"lastName\":\"User\"}"
```

Admin UI:

```
http://localhost:3000/admin
```

---

## Notes

* Frontend uses **Next.js**
* Email sending is handled using **Resend**
* API documentation is available via **Swagger**
