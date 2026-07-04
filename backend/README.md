# HRMS Backend API

Express + TypeScript REST API, running at `http://localhost:4000`.

---

## Quick Start

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate            # apply schema migrations (requires PostgreSQL)
npm run db:seed               # optional — insert demo data
npm run dev                   # ts-node-dev, hot-reload on :4000
```

---

## Environment Variables

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://postgres:password@localhost:5432/hrms_db` |
| `JWT_SECRET` | ✅ | `super-secret-32-char-string-here` |
| `JWT_EXPIRES_IN` | ❌ | `7d` (default) |
| `PORT` | ❌ | `4000` (default) |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:3000` (default) |

---

## API Endpoints — curl Cheatsheet

> Replace `TOKEN` with the JWT returned by `/login` or `/signup`.
> All responses are `Content-Type: application/json`.

### Health Check

```bash
curl http://localhost:4000/api/health
```

---

### Auth Routes  (`/api/auth`)

#### 1. POST `/api/auth/signup`  
Create a company + first admin account. **Public — no auth required.**

```bash
curl -s -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Corp",
    "companyEmail": "admin@acmecorp.com",
    "firstName": "Arjun",
    "lastName": "Sharma",
    "email": "arjun@acmecorp.com",
    "password": "Admin@1234"
  }' | jq .
```

**Success `201`:**
```json
{
  "message": "Company and admin account created successfully.",
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "loginId": "ACarsm2024001",
    "email": "arjun@acmecorp.com",
    "role": "admin",
    "firstName": "Arjun",
    "lastName": "Sharma",
    "mustChangePassword": false,
    "companyId": "uuid",
    "companyName": "Acme Corp"
  }
}
```

**Validation failure `400`:**
```json
{
  "error": {
    "message": "Validation failed",
    "fields": [
      { "field": "email", "message": "Please enter a valid email address" },
      { "field": "password", "message": "Password must contain at least one number" }
    ]
  }
}
```

---

#### 2. POST `/api/auth/login`  
Login with email + password. **Public.**

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "arjun@acmecorp.com",
    "password": "Admin@1234"
  }' | jq .
```

**Success `200`:**
```json
{
  "token": "<jwt>",
  "mustChangePassword": false,
  "user": {
    "id": "uuid",
    "loginId": "ACarsm2024001",
    "email": "arjun@acmecorp.com",
    "role": "admin",
    "firstName": "Arjun",
    "lastName": "Sharma",
    "companyId": "uuid"
  }
}
```

> **Note:** Wrong email and wrong password both return the same `401` message — intentional to avoid user enumeration.

---

#### 3. POST `/api/auth/users`  
Create an HR or employee account. **Requires auth (admin or hr).**

```bash
# Save the token from login first:
TOKEN="<paste jwt here>"

curl -s -X POST http://localhost:4000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Priya",
    "lastName": "Nair",
    "email": "priya@acmecorp.com",
    "role": "hr",
    "phone": "+91-9800000001"
  }' | jq .
```

**Success `201`:**
```json
{
  "message": "User created. Share the generated password with the new user securely — it will not be shown again.",
  "user": {
    "id": "uuid",
    "loginId": "ACprir2024002",
    "email": "priya@acmecorp.com",
    "role": "hr",
    "firstName": "Priya",
    "lastName": "Nair",
    "mustChangePassword": true
  },
  "generatedPassword": "aB3xYmQpR914"
}
```

**Forbidden `403` (hr trying to create hr):**
```json
{
  "error": { "message": "A user with role 'hr' cannot create a 'hr' account." }
}
```

---

#### 4. POST `/api/auth/change-password`  
Change own password (required when `mustChangePassword: true`). **Requires auth.**

```bash
curl -s -X POST http://localhost:4000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "aB3xYmQpR914",
    "newPassword": "MyNewPass99"
  }' | jq .
```

**Success `200`:**
```json
{ "message": "Password changed successfully." }
```

**Wrong current password `400`:**
```json
{
  "error": {
    "message": "Current password is incorrect.",
    "field": "currentPassword"
  }
}
```

---

## Error Response Shape

All errors follow this exact envelope — the frontend maps `fields[]` to inline form errors:

```json
{
  "error": {
    "message": "Human-readable summary",
    "field": "fieldName",
    "fields": [
      { "field": "email",    "message": "Please enter a valid email address" },
      { "field": "password", "message": "Password must contain at least one number" }
    ]
  }
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Validation failed or bad request |
| `401` | Missing / invalid / expired JWT |
| `403` | Authenticated but not permitted |
| `404` | Resource not found |
| `409` | Conflict (email or company already exists) |
| `500` | Internal server error |

---

## Project Structure

```
backend/src/
├── config/          env.ts · prisma.ts
├── middleware/       auth · roleGuard · validate · error
├── routes/          index.ts · health · auth
├── controllers/     auth.controller.ts
├── services/        auth.service.ts
├── utils/           ApiError · permissions · jwt · loginId
├── types/           express.d.ts  (req.user typing)
├── app.ts           Express factory
└── server.ts        Entry point
```

---

## Branching Convention

| Branch | Purpose |
|---|---|
| `main` | Production-ready |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Tooling, deps, refactors |
