# Human Resource Management System (HRMS)

A full-stack Human Resource Management System designed to handle core HR operations including employee management, attendance tracking, leave requests, and payroll processing. 

This repository is structured as a monorepo containing independent frontend and backend services that communicate via a REST API.

---

## Features

- Authentication & Authorization: Role-based access control (Admin, HR, Employee) with JWT.
- Employee Management: Profiles, onboarding, departments, and job positions.
- Attendance Tracking: Check-in/check-out system and attendance logs.
- Leave Management: Leave types, allocations, and approval workflows.
- Payroll Processing: Salary structures, compensation components (earnings/deductions).

---

## Technology Stack

### Frontend
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: Radix UI, Framer Motion
- Forms & Validation: React Hook Form, Zod

### Backend
- Framework: Node.js with Express
- Language: TypeScript
- ORM: Prisma
- Validation: Zod
- Authentication: JSON Web Tokens (JWT), bcrypt

### Database
- Engine: PostgreSQL 15+

---

## Repository Structure

```text
hrms/
├── frontend/          Next.js application
├── backend/           Express REST API
├── database/          Raw SQL schemas and seeds (reference)
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

## Environment Setup

### Database Configuration

1. Start your PostgreSQL service.
2. Create a new database named `hrms_db`.

You can initialize the database schema using Prisma from the backend directory (recommended) or use the raw SQL files provided in the `database` folder.

### Backend Setup (Port 4000)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your specific configurations (e.g., `DATABASE_URL`, `JWT_SECRET`).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Apply database migrations and generate the Prisma client:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
6. Start the development server:
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
3. Ensure `NEXT_PUBLIC_API_URL` is set to your backend address (default: `http://localhost:4000/api/v1`).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The application will be accessible at http://localhost:3000.

---

## Environment Variables Reference

### Backend (.env)

- `PORT`: Port for the Express server (default: 4000)
- `NODE_ENV`: Runtime environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: Token validity duration (e.g., 7d)
- `ALLOWED_ORIGINS`: Allowed CORS origins (e.g., http://localhost:3000)

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL`: Backend API base URL

---

## Git Workflow Guidelines

Please follow standard branching conventions for all contributions:

- `main`: Production-ready code. Commits should only come from merged Pull Requests.
- `develop`: Main integration branch.
- `feature/<name>`: For new features.
- `fix/<name>`: For bug fixes.
- `chore/<name>`: For maintenance tasks.

To contribute:
1. Ensure you are on `develop` and up to date.
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes with descriptive messages.
4. Push your branch and open a Pull Request against `develop`.

---

## License

This project is licensed under the MIT License.
