# LinguaAI — Backend

> AI-powered English learning platform for Georgian speakers — Backend API

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white&style=flat-square)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white&style=flat-square)

---

## About

LinguaAI is an AI-powered language learning platform currently focused on **English**. More languages may be added in the future. This is the backend API that handles authentication, user management, and will power the following core learning features:

- **Text-to-Speech** — serve audio for any input text
- **Sentence Builder** — validate and assist sentence construction from word sets
- **Topic-based Text Generation** — generate contextual reading passages on demand

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS (Node.js) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens), Google OAuth 2.0 |
| Password hashing | Argon2 |
| Email | Resend |
| Security | Helmet, Rate limiting (@nestjs/throttler) |
| Logging | nestjs-pino (pretty in dev, JSON in prod) |
| API Docs | Swagger / OpenAPI |
| Testing | Jest + Supertest |

## Security Highlights

- 🔒 Passwords hashed with **Argon2** (not bcrypt)
- 🍪 Refresh tokens stored in **HttpOnly cookies** — not accessible to JavaScript
- 🔄 **Refresh token rotation** — every refresh issues a new token and invalidates the old one
- 🗄️ Refresh tokens stored as **hashes** in the database — plain text never persists
- �️ **Two-Factor Authentication (TOTP)** — Google Authenticator / Authy compatible
- �🚫 **Rate limiting** on all auth endpoints
- 🛡️ **Helmet** HTTP security headers
- ✉️ Password reset tokens expire in **1 hour**
- 🔐 Role-based access control (REGULAR / ADMIN)

## Features

### Learning (planned / in development)
- 🔊 **Text-to-Speech** — audio playback for any text
- ✍️ **Sentence Builder** — word-set based sentence construction
- 📝 **Text Generator** — topic-based English reading passages

### Auth & Platform
- 📝 Register & login with email/password
- 🔑 Google OAuth 2.0 login
- 📧 Email verification (required before login)
- 🔄 Forgot / reset password via email
- ♻️ JWT access token (15m) + refresh token (7d, HttpOnly cookie)
- 🔑 Two-Factor Authentication (TOTP) — enable/disable via Google Authenticator or Authy
- 👤 User profile — view, edit name, change password
- 🛠️ Admin panel — view all users, change role, delete user, pagination

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL via docker-compose)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file:

```env
NODE_ENV=development

APPLICATION_PORT=4000
APPLICATION_URL=http://localhost:4000
ALLOWED_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Cookies
COOKIES_SECRET=your_cookies_secret

# PostgreSQL
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=auth_db
POSTGRES_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5433/auth_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Resend (email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Start the database

```bash
docker-compose up -d
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Start the server

```bash
# development
npm run start:dev

# production
npm run build && npm run start:prod
```

Server runs on `http://localhost:4000`. Swagger UI at `http://localhost:4000/docs`.

### 6. Run tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## API Reference

### Auth (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register with email/password |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout (clears refresh cookie) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/verify-email` | Verify email via token |
| POST | `/auth/forgot-password` | Send reset password email |
| POST | `/auth/reset-password` | Reset password via token |
| POST | `/auth/2fa/generate` | Generate TOTP secret + QR code |
| POST | `/auth/2fa/enable` | Enable 2FA after scanning QR |
| POST | `/auth/2fa/disable` | Disable 2FA |
| POST | `/auth/2fa/verify` | Complete login with 2FA code |

### User (`/user`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/me` | Get current user profile |
| PATCH | `/user/me` | Update name |
| PATCH | `/user/me/password` | Change password |

### Admin (`/admin`) — requires JWT + ADMIN role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| PATCH | `/admin/users/:id/role` | Change user role |
| DELETE | `/admin/users/:id` | Delete user |

## Project Structure

```
src/
├── auth/          # Auth module — login, register, OAuth, JWT strategies, guards
├── user/          # User module — profile, password change
├── admin/         # Admin module — user management
├── mail/          # Mail module — Resend email service
├── prisma/        # Prisma service
└── libs/          # Shared utilities and validators
prisma/
├── schema.prisma  # Database schema
└── migrations/    # Migration history
```

## CI/CD

> CI/CD pipeline not yet configured. Deployment setup is planned for a future release.
