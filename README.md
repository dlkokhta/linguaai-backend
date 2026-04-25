# LinguaAI — Backend

> AI-powered English learning platform for Georgian speakers — Backend API

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white&style=flat-square)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white&style=flat-square)

---

## About

LinguaAI is an AI-powered English language learning platform built for Georgian speakers. This is the backend REST API powering authentication, user management, AI content generation, translation, and vocabulary features.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11 (Node.js) |
| Language | TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWT (access + refresh tokens), Google OAuth 2.0 |
| Password hashing | Argon2 |
| AI | Groq API (llama-3.3-70b-versatile) |
| Email | Resend |
| Security | Helmet, Rate limiting (@nestjs/throttler) |
| Logging | nestjs-pino |
| API Docs | Swagger / OpenAPI |
| Testing | Jest + Supertest |

---

## Security Highlights

- Passwords hashed with **Argon2** (not bcrypt)
- Refresh tokens stored in **HttpOnly cookies** — not accessible to JavaScript
- **Refresh token rotation** — every refresh issues a new token and invalidates the old one
- Refresh tokens stored as **hashes** in the database — plain text never persists
- **Two-Factor Authentication (TOTP)** — Google Authenticator / Authy compatible
- **Rate limiting** on all auth endpoints
- **Helmet** HTTP security headers
- Password reset tokens expire in **1 hour**
- Role-based access control (REGULAR / ADMIN)

---

## Features

### Learning
- **Generate Sentences** — AI generates 10 English sentences with Georgian translations on any topic and difficulty
- **Generate Quiz** — AI generates 10 fill-in-the-blank quiz questions for a given tense and level; includes structural validation and automatic retry for invalid questions
- **Translate Word** — single word translation
- **Translate Text** — full paragraph translation
- **Saved Sentences** — save, list, and delete sentences per user
- **Saved Words** — save, list, and delete vocabulary words per user
- **Weekly Goal** — set weekly sentence and word targets; track progress from Monday of the current week

### Auth & Platform
- Register & login with email/password
- Google OAuth 2.0 login
- Email verification (required before login)
- Forgot / reset password via email
- JWT access token (15m) + refresh token (7d, HttpOnly cookie)
- Two-Factor Authentication (TOTP) — enable/disable via Google Authenticator or Authy
- User profile — view, edit name, change password
- Admin panel — view all users, change role, delete user

---

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

# PostgreSQL
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
POSTGRES_DB=linguaai_db
POSTGRES_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5434/linguaai_db

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

# Groq AI
GROQ_API_KEY=your_groq_api_key
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
npm run test          # unit tests (watch)
npm run test:cov      # unit tests with coverage
npm run test:e2e      # E2E tests
```

---

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

### Generate (`/generate`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/sentences` | Generate 10 AI sentences with Georgian translations |
| POST | `/generate/quiz` | Generate 10 fill-in-the-blank quiz questions for a tense |

### Translate (`/translate`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/translate/word` | Translate a single word |
| POST | `/translate/text` | Translate a full text |

### Saved Sentences (`/saved-sentences`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/saved-sentences` | Save a sentence |
| GET | `/saved-sentences` | Get all saved sentences |
| DELETE | `/saved-sentences/:id` | Delete a saved sentence |

### Saved Words (`/saved-words`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/saved-words` | Save a word |
| GET | `/saved-words` | Get all saved words |
| DELETE | `/saved-words/:id` | Delete a saved word |

### Weekly Goal (`/weekly-goal`) — requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weekly-goal` | Get current goal and this week's progress |
| POST | `/weekly-goal` | Set or update weekly sentence and word goals |

---

## Project Structure

```
src/
├── auth/              # Auth module — login, register, OAuth, JWT, 2FA
├── user/              # User module — profile, password change
├── admin/             # Admin module — user management
├── generate/          # AI generation — sentences and quiz via Groq
├── translate/         # Translation module
├── saved-sentences/   # Saved sentences per user
├── saved-words/       # Saved words per user
├── weekly-goal/       # Weekly goal — set targets and track weekly progress
├── mail/              # Mail module — Resend email service
├── prisma/            # Prisma service
└── libs/              # Shared utilities, validators, exception filters
prisma/
├── schema.prisma      # Database schema
└── migrations/        # Migration history
```

---

## CI/CD

Automated deployment via GitHub Actions on push to `master`:
1. SSH into production server
2. Pull latest code
3. Install dependencies
4. Run Prisma migrations
5. Build the app
6. Restart with PM2
