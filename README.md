# HRMS — Human Resource Management System

> A full-stack HRMS monorepo for managing employees, attendance, leave, and payroll.
> Built with **Next.js 14 (App Router)** on the frontend and **Node.js + Express** on the backend.

---

## Repository Layout

```
hrms/
├── frontend/          Next.js 14 App Router + TypeScript
├── backend/           Node.js + Express + TypeScript (standalone REST API)
├── database/
│   ├── schema.sql     DDL — run this first to create all tables
│   └── seed.sql       Sample data — run after schema.sql
├── .gitignore
└── README.md
```

The **frontend** and **backend** are fully independent workspaces. They share no
code, no dependencies, and no `node_modules`. They communicate **only over HTTP**.

---

## Prerequisites

| Tool       | Version   |
|------------|-----------|
| Node.js    | ≥ 18.x    |
| npm        | ≥ 9.x     |
| PostgreSQL | ≥ 15.x    |

---

## Running Both Services Locally

Open **two separate terminals** from the repository root:

### Terminal 1 — Backend API (port 4000)

```bash
cd backend
cp .env.example .env       # fill in your DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

### Terminal 2 — Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev
```

Open <http://localhost:3000> in your browser.

---

## Environment Variables

### `backend/.env` (copy from `.env.example`)

| Variable          | Description                                  | Example                                              |
|-------------------|----------------------------------------------|------------------------------------------------------|
| `PORT`            | Port the API listens on                      | `4000`                                               |
| `NODE_ENV`        | Runtime environment                          | `development`                                        |
| `DATABASE_URL`    | PostgreSQL connection string                 | `postgresql://postgres:password@localhost:5432/hrms` |
| `JWT_SECRET`      | Secret key for signing JSON Web Tokens       | *(long random string)*                               |
| `JWT_EXPIRES_IN`  | Token expiry duration                        | `7d`                                                 |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins         | `http://localhost:3000`                              |

### `frontend/.env.local` (copy from `.env.example`)

| Variable               | Description                    | Example                                |
|------------------------|--------------------------------|----------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Base URL of the backend API    | `http://localhost:4000/api/v1`         |

---

## Database Setup

Ensure PostgreSQL is running, then:

```bash
psql -U postgres -c "CREATE DATABASE hrms_db;"
psql -U postgres -d hrms_db -f database/schema.sql
psql -U postgres -d hrms_db -f database/seed.sql
```

Default seed password for all employees: **`Password@123`**

---

## Git Branching Convention

| Branch pattern      | Purpose                                          |
|---------------------|--------------------------------------------------|
| `main`              | Production-ready code — merge via PR only        |
| `develop`           | Integration branch — all feature PRs target here |
| `feature/<name>`    | New features, e.g. `feature/employee-profile`    |
| `fix/<name>`        | Bug fixes, e.g. `fix/login-redirect`             |
| `chore/<name>`      | Non-functional work, e.g. `chore/update-deps`    |

### Workflow for team members

```bash
# 1. Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Work, commit often with meaningful messages
git add .
git commit -m "feat: add employee list pagination"

# 3. Push and open a Pull Request → develop
git push origin feature/your-feature-name
```

> **Hackathon note:** Each team member must push their own branches and commits.
> Do **not** push everyone's code from a single person's machine — judges verify
> the contributor graph.

---

## Scripts Reference

| Directory  | Command           | Description                    |
|------------|-------------------|--------------------------------|
| `frontend` | `npm run dev`     | Start Next.js dev server       |
| `frontend` | `npm run build`   | Production build               |
| `frontend` | `npm run lint`    | Run ESLint                     |
| `backend`  | `npm run dev`     | Start API with hot-reload      |
| `backend`  | `npm run build`   | Compile TypeScript → `dist/`   |
| `backend`  | `npm start`       | Run compiled production server |
| `backend`  | `npm run type-check` | Type-check without building |

---

## Health Check

Once the backend is running:

```bash
curl http://localhost:4000/health
# → {"status":"ok","service":"hrms-backend","timestamp":"...","environment":"development"}
```

---

## License

MIT
