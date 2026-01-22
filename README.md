Tibeb v1.1

Freelance Marketplace Platform

Tibeb is a full-stack freelance marketplace designed to connect clients with freelancers through a secure job, proposal, and contract workflow. The system includes escrow-based payments, real-time messaging, and admin moderation tools to ensure platform trust, transparency, and system integrity.

Quick Start
Prerequisites

Node.js 18+

PostgreSQL 14+

Installation
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

Running the Application
Option 1: Without Docker (Recommended for Development)
1) Start PostgreSQL

Ensure PostgreSQL is running on port 5432

2) Configure Backend Environment

Copy:

backend/.env.example → backend/.env


Set:

DATABASE_URL
JWT_SECRET
FRONTEND_URL
RESEND_API_KEY (optional)
ADMIN_CREATE_SECRET

3) Run Migrations
cd backend
npx prisma migrate deploy
npx prisma generate

4) Start Backend
npm run dev


Backend:

http://localhost:5000


API Documentation:

http://localhost:5000/api-docs

5) Configure Frontend Environment

Create:

frontend/.env.local


Add:

NEXT_PUBLIC_API_URL=http://localhost:5000/api

6) Start Frontend
cd frontend
npm run dev


Frontend:

http://localhost:3000

Live Deployment

Frontend:

https://tibeb.shop


Backend API:

https://tibeb-backend.onrender.com

Problem Statement

Many freelance platforms struggle with trust, payment security, and moderation transparency. Clients risk incomplete work, while freelancers risk delayed or missing payments.

Tibeb addresses these challenges by:

Using escrow-based payments to protect both parties

Providing admin oversight and dispute resolution

Enforcing role-based access control

Supporting real-time communication for faster collaboration

Key Features
Client

Create and publish jobs

Review freelancer proposals

Send offers and manage contracts

Mark job progress and completion

Leave reviews

Freelancer

Browse available jobs

Submit proposals

Accept or reject offers

Work on active contracts

Leave reviews

Admin

Create and manage admin users

Moderate users, jobs, and proposals

Resolve escrow disputes and refunds

Monitor system activity and logs

Tech Stack
Backend

Node.js

Express.js

Prisma ORM

PostgreSQL

JWT Authentication

Swagger API Documentation

Frontend

Next.js (App Router)

React

Tailwind CSS

Services

Resend (Email delivery)

Chapa (Payments and escrow)

Render (Backend hosting)

Vercel (Frontend hosting)

Architecture Overview
[Frontend - Next.js]
        |
        v
[Backend - Express API]
        |
        v
[PostgreSQL Database]
        |
        v
[External Services]
 - Email (Resend)
 - Payments (Chapa)

Project Structure
Tibeb/
├── backend/                    # Express backend
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, guards
│   │   └── prisma/            # Database schema and migrations
│   └── .env                   # Backend configuration
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # App routes
│   │   ├── services/         # API client
│   │   └── context/          # Authentication context
│   └── .env.local            # Frontend configuration

Testing
Unit Tests
cd backend
npm test -- tests/unit

Integration Tests
$env:TEST_DATABASE_URL="postgresql://postgres:YOURPASS@localhost:5432/tibeb_test"
npx prisma migrate deploy
npm test -- tests/integration

End-to-End Tests
npm test -- tests/e2e

Admin Creation

Create an admin user using a secure secret header:

curl -X POST http://localhost:5000/api/admin/create ^
  -H "Content-Type: application/json" ^
  -H "x-admin-secret: your-secret" ^
  -d "{\"email\":\"admin@tibeb.shop\",\"password\":\"StrongPass123\",\"firstName\":\"Admin\",\"lastName\":\"User\"}"


Admin Panel:

http://localhost:3000/admin

Security Features

JWT-based authentication

Role-based access control (Client, Freelancer, Admin)

Secure admin creation using secret headers

Password hashing with bcrypt

Protected API routes

Input validation and sanitization

Business Rules Implemented

One active contract per accepted job

Escrow funds must be released before job completion

Only verified users can submit proposals

Only admins can resolve disputes and issue refunds

Reviews allowed only after contract completion

Development Commands
Backend
npm run dev        # Development mode
npm run build     # Production build
npm test          # Run all tests

Frontend
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production build

Academic Context

This project was developed as part of a Software Engineering course and follows a structured engineering workflow:

Software Requirement Specification (SRS)

Software Design Document (SDD)

Implementation

Testing and Validation

Deployment and Demonstration

For Examiners
Critical Components

Authentication and Role Management: backend/src/middleware/auth.ts

Escrow and Payment Flow: backend/src/services/payment.service.ts

Real-Time Messaging: backend/src/services/socket.service.ts

Admin Moderation: backend/src/controllers/admin.controller.ts

Demo Setup
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev


Swagger:

http://localhost:5000/api-docs

Project Status

Backend: Feature complete

Frontend: Feature complete

Overall: Ready for academic demonstration and evaluation

License

This project is for educational purposes only.