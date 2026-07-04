# Human Resource Management System (HRMS)

A full-stack Human Resource Management System designed to handle core HR operations including employee management, attendance tracking, leave requests, and payroll processing. 

This repository is structured as a monorepo containing independent frontend and backend services that communicate via a REST API.

---

## Features

- **Authentication & Authorization**: Role-based access control (Admin, HR, Employee) with JWT.
- **Employee Management**: Profiles, onboarding, departments, and job positions.
- **Attendance Tracking**: Real-time check-in/check-out system and attendance logs.
- **Leave Management**: Leave types, allocations, and approval workflows.
- **Payroll Processing**: Salary structures, compensation components (earnings/deductions).
- **Custom Login IDs**: Formatted dynamically based on company name, employee name, hire year, and a serial number (e.g., `OIARSH20260001` for Odoo India).

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Framer Motion, Lucide React
- **Forms & Validation**: React Hook Form, Zod

### Backend
- **Framework**: Node.js with Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JSON Web Tokens (JWT), bcrypt

### Database
- **Engine**: PostgreSQL 15+

---

## Repository Structure

```text
hrms/
├── frontend/          Next.js application
│   ├── app/           Next.js App Router pages and layouts
│   ├── public/        Static assets
│   ├── .env.local     Frontend environment variables
│   └── package.json   Frontend dependencies
├── backend/           Express REST API
│   ├── src/           API controllers, routes, and services
│   ├── prisma/        Prisma schema and seed scripts
│   ├── .env           Backend environment variables
│   └── package.json   Backend dependencies
├── .gitignore
└── README.md
```

---

## Prerequisites

Ensure the following tools are installed on your system before proceeding:

- Node.js (v18.x or higher)
- npm (v9.x or higher)
- PostgreSQL (v15.x or higher)

---

## Getting Started

### Database Configuration

1. Ensure your local PostgreSQL service is running.
2. Create a new database (e.g., `hrms_db`).

### Backend Setup (Port 4000)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your specific configurations:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/hrms_db?schema=public"
   JWT_SECRET="your_secure_random_string"
   JWT_EXPIRES_IN="7d"
   ALLOWED_ORIGINS="http://localhost:3000"
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Apply database migrations and generate the Prisma client:
   ```bash
   npm run db:migrate
   ```
6. Seed the database with initial demo data (Odoo India employees):
   ```bash
   npm run db:seed
   ```
7. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Setup (Port 3000)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```
3. Ensure `NEXT_PUBLIC_API_URL` is set to your backend address:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend application will now be accessible at [http://localhost:3000](http://localhost:3000).

---

## Seeded Credentials (Demo Data)

The database seed (`backend/prisma/seed.ts`) populates the system with users under the company **Odoo India**. 

**Password for all users:** `Dev@12345`

| Role       | Login ID         | Full Name       |
|------------|------------------|-----------------|
| `admin`    | `OIARSH20260001` | Arjun Sharma    |
| `hr`       | `OIPRNA20260002` | Priya Nair      |
| `hr`       | `OIKIDA20260003` | Kiran Das       |
| `employee` | `OIRAME20260004` | Rahul Mehta     |
| `employee` | `OISNPA20260005` | Sneha Patel     |
| `employee` | `OIVISI20260006` | Vikram Singh    |
| `employee` | `OIANRE20260007` | Anjali Reddy    |
| `employee` | `OIMEJO20260008` | Meera Joshi     |
| `employee` | `OIROGU20260009` | Rohan Gupta     |

---

## Available Scripts

### Backend (`/backend`)
- `npm run dev`: Starts the Express API with hot-reloading (`ts-node-dev`).
- `npm run build`: Compiles TypeScript to JavaScript in the `dist/` folder.
- `npm run start`: Runs the compiled output in `dist/server.js`.
- `npm run type-check`: Validates TypeScript without emitting files.
- `npm run db:generate`: Generates Prisma Client.
- `npm run db:migrate`: Runs pending migrations against the database.
- `npm run db:seed`: Seeds the database with demo users and attendance records.
- `npm run db:studio`: Opens Prisma Studio GUI at `http://localhost:5555`.
- `npm run db:reset`: Resets the database and applies all migrations from scratch.

### Frontend (`/frontend`)
- `npm run dev`: Starts the Next.js dev server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the application in production mode.
- `npm run lint`: Runs ESLint over the frontend project.

---

## License

This project is licensed under the MIT License.
