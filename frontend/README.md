# HRMS Frontend

This is the Next.js frontend application for the Human Resource Management System (HRMS).

It is built using the Next.js App Router, TypeScript, and Tailwind CSS. It communicates directly with the backend REST API.

---

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** Radix UI primitives, Lucide React icons, Framer Motion
- **Data Validation:** Zod + React Hook Form

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the example environment file and update it if necessary:
   ```bash
   cp .env.example .env.local
   ```
   *Make sure `NEXT_PUBLIC_API_URL` points to your backend instance (default is `http://localhost:4000/api`).*

3. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Project Structure

- `app/`: Next.js App Router definitions, pages, and layouts.
- `components/`: Reusable React components (UI library, forms, tables).
- `lib/`: Shared utilities and helpers.
- `public/`: Static assets.

---

## Scripts

- `npm run dev`: Starts the development server with Hot Module Replacement.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production server (requires a prior build).
- `npm run lint`: Runs ESLint to check for code issues.
