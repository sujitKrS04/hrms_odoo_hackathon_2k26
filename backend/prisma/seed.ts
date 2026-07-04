/**
 * backend/prisma/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive HRMS development seed.
 *
 * Setup order:
 *   1. npm install
 *   2. npm run db:generate        ← generate Prisma Client
 *   3. npm run db:migrate         ← create DB tables  (OR db:push for quick dev)
 *   4. npm run db:seed            ← this file
 *
 * Dev password for ALL seeded users: Dev@12345
 *
 * Login-ID format: <company-code> + first2(firstName) + last2(lastName)
 *                  + hireYear + 3-digit serial
 *   e.g. Arjun Sharma (2024, #001) → ACarma2024001
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  PrismaClient,
  AttendanceStatus,
  CompensationType,
  SalaryComponentName,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_PASSWORD  = 'Dev@12345';
const BCRYPT_ROUNDS = 12;

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the last N Monday–Friday calendar days in ascending (oldest-first)
 * order. Today is included if it is a weekday.
 */
function getLastNWorkingDays(n: number): Date[] {
  const days: Date[] = [];
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (days.length < n) {
    const dow = cur.getDay(); // 0=Sun 6=Sat
    if (dow !== 0 && dow !== 6) days.unshift(new Date(cur));
    cur.setDate(cur.getDate() - 1);
  }
  return days;
}

/** Advance a date by exactly N working (Mon–Fri) days. */
function addWorkingDays(from: Date, n: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

/** Clone a date and set its time to h:m:00.000 (local). */
function ts(date: Date, h: number, m: number): Date {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── Attendance Patterns ──────────────────────────────────────────────────────
// Index 0 = oldest working day, index 9 = newest (today or most recent weekday).
// Each entry mirrors one calendar day of attendance for that employee.

type AttDay = {
  status: AttendanceStatus;
  inH?: number;
  inM?: number;
  outH?: number;
  outM?: number;
  note?: string;
};

const PATTERNS: Record<string, AttDay[]> = {
  // ── Arjun Sharma — Admin / CTO ──────────────────────────────────────────
  'admin@odoo2026': [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'present',        inH: 8,  inM: 50, outH: 18, outM: 45 },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 20, outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 0  },
    { status: 'present',        inH: 8,  inM: 55, outH: 18, outM: 30 },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 19, outM: 0  },
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 30 },
  ],
  // ── Priya Nair — HR Director ────────────────────────────────────────────
  ACprir2024002: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 20, outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 15 },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 0  },
    { status: 'half_day',       inH: 9,  inM: 0,  outH: 13, outM: 30, note: 'Medical appointment' },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 10, outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
  ],
  // ── Kiran Das — HR Business Partner ────────────────────────────────────
  ACkias2024003: [
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 30 },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 0  },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 15 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 20, outH: 18, outM: 0  },
    { status: 'absent',                                                  note: 'Personal reasons' },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 30 },
    { status: 'work_from_home', inH: 9,  inM: 0,  outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 30, outH: 18, outM: 15 },
  ],
  // ── Rahul Mehta — Engineering Manager (on_leave index 4 = approved sick) ─
  ACrata2024004: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 45 },
    { status: 'present',        inH: 8,  inM: 55, outH: 19, outM: 0  },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 15 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'on_leave',                                                note: 'Approved sick leave' },
    { status: 'present',        inH: 9,  inM: 15, outH: 19, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 0,  outH: 18, outM: 0  },
    { status: 'present',        inH: 8,  inM: 45, outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 10, outH: 19, outM: 30, note: 'Sprint crunch' },
    { status: 'present',        inH: 9,  inM: 0,  outH: 20, outM: 0,  note: 'Sprint crunch' },
  ],
  // ── Sneha Patel — Senior Software Engineer ──────────────────────────────
  ACsnel2024005: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 25, outH: 18, outM: 45 },
    { status: 'work_from_home', inH: 9,  inM: 0,  outH: 17, outM: 30 },
    { status: 'half_day',       inH: 9,  inM: 0,  outH: 13, outM: 0,  note: 'Personal errand' },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 15 },
    { status: 'present',        inH: 9,  inM: 30, outH: 19, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 15, outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
  ],
  // ── Vikram Singh — Software Engineer ────────────────────────────────────
  ACvigh2024006: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 0  },
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 20, outH: 18, outM: 15 },
    { status: 'absent',                                                  note: 'Sick' },
    { status: 'present',        inH: 9,  inM: 30, outH: 18, outM: 45 },
    { status: 'work_from_home', inH: 9,  inM: 0,  outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 30 },
  ],
  // ── Anjali Reddy — Junior Software Engineer ─────────────────────────────
  ACandy2024007: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 15 },
    { status: 'half_day',       inH: 9,  inM: 0,  outH: 13, outM: 30, note: 'Bank work' },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 30 },
    { status: 'absent',                                                  note: 'Unplanned' },
    { status: 'present',        inH: 9,  inM: 20, outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 0  },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 0  },
  ],
  // ── Meera Joshi — Finance Analyst (on_leave indices 6-7-8 = approved PTO) ─
  ACmehi2024008: [
    { status: 'present',        inH: 9,  inM: 5,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 15, outH: 17, outM: 30 },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 0  },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 45 },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 0  },
    { status: 'on_leave',                                                note: 'Approved PTO' },
    { status: 'on_leave',                                                note: 'Approved PTO' },
    { status: 'on_leave',                                                note: 'Approved PTO' },
    { status: 'present',        inH: 9,  inM: 0,  outH: 17, outM: 30 },
  ],
  // ── Rohan Gupta — Account Executive ────────────────────────────────────
  ACrota2024009: [
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 30 },
    { status: 'present',        inH: 9,  inM: 15, outH: 18, outM: 45 },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
    { status: 'present',        inH: 9,  inM: 10, outH: 18, outM: 15 },
    { status: 'present',        inH: 9,  inM: 5,  outH: 19, outM: 30, note: 'Client meeting' },
    { status: 'half_day',       inH: 9,  inM: 0,  outH: 13, outM: 0,  note: 'Internal half-day' },
    { status: 'present',        inH: 9,  inM: 15, outH: 19, outM: 0,  note: 'Client presentation' },
    { status: 'work_from_home', inH: 9,  inM: 30, outH: 17, outM: 30 },
    { status: 'present',        inH: 9,  inM: 0,  outH: 18, outM: 0  },
  ],
};

// ─── Salary Data ──────────────────────────────────────────────────────────────
// Monthly amounts (INR). CTC = annual cost to company = sum(earnings) × 12.
// Each employee has genuinely different Basic/HRA values.

type ComponentDef = {
  name: string;
  type: string;
  amount: number;
};

type SalaryDef = {
  ctc: number;
  effectiveFrom: string;
  components: ComponentDef[];
};

const SALARY: Record<string, SalaryDef> = {
  // CTO — Monthly gross 350 000 → CTC 4 200 000
  'admin@odoo2026': {
    ctc: 4_200_000, effectiveFrom: '2024-01-15',
    components: [
      { name: 'basic',                type: 'earning',   amount: 200_000 },
      { name: 'hra',                  type: 'earning',   amount:  80_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   5_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   3_000 },
      { name: 'special_allowance',    type: 'earning',   amount:  62_000 },
      { name: 'provident_fund',       type: 'deduction', amount:  24_000 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:  45_000 },
    ],
  },
  // HR Director — Monthly gross 230 000 → CTC 2 760 000
  ACprir2024002: {
    ctc: 2_760_000, effectiveFrom: '2024-02-01',
    components: [
      { name: 'basic',                type: 'earning',   amount: 140_000 },
      { name: 'hra',                  type: 'earning',   amount:  56_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   4_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   3_000 },
      { name: 'special_allowance',    type: 'earning',   amount:  27_000 },
      { name: 'provident_fund',       type: 'deduction', amount:  16_800 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:  23_000 },
    ],
  },
  // HR BP — Monthly gross 150 000 → CTC 1 800 000
  ACkias2024003: {
    ctc: 1_800_000, effectiveFrom: '2024-03-15',
    components: [
      { name: 'basic',                type: 'earning',   amount:  90_000 },
      { name: 'hra',                  type: 'earning',   amount:  36_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   3_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_500 },
      { name: 'special_allowance',    type: 'earning',   amount:  18_500 },
      { name: 'provident_fund',       type: 'deduction', amount:  10_800 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:   8_500 },
    ],
  },
  // Eng Manager — Monthly gross 270 000 → CTC 3 240 000
  ACrata2024004: {
    ctc: 3_240_000, effectiveFrom: '2024-03-01',
    components: [
      { name: 'basic',                type: 'earning',   amount: 160_000 },
      { name: 'hra',                  type: 'earning',   amount:  64_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   4_500 },
      { name: 'medical_allowance',    type: 'earning',   amount:   3_000 },
      { name: 'special_allowance',    type: 'earning',   amount:  38_500 },
      { name: 'provident_fund',       type: 'deduction', amount:  19_200 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:  35_000 },
    ],
  },
  // Sr SWE — Monthly gross 180 000 → CTC 2 160 000
  ACsnel2024005: {
    ctc: 2_160_000, effectiveFrom: '2024-04-01',
    components: [
      { name: 'basic',                type: 'earning',   amount: 110_000 },
      { name: 'hra',                  type: 'earning',   amount:  44_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   3_500 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_500 },
      { name: 'special_allowance',    type: 'earning',   amount:  20_000 },
      { name: 'provident_fund',       type: 'deduction', amount:  13_200 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:  12_000 },
    ],
  },
  // SWE — Monthly gross 130 000 → CTC 1 560 000
  ACvigh2024006: {
    ctc: 1_560_000, effectiveFrom: '2024-05-01',
    components: [
      { name: 'basic',                type: 'earning',   amount:  80_000 },
      { name: 'hra',                  type: 'earning',   amount:  32_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   3_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_500 },
      { name: 'special_allowance',    type: 'earning',   amount:  12_500 },
      { name: 'provident_fund',       type: 'deduction', amount:   9_600 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:   6_000 },
    ],
  },
  // Jr SWE — Monthly gross 90 000 → CTC 1 080 000  (below tax slab)
  ACandy2024007: {
    ctc: 1_080_000, effectiveFrom: '2024-06-01',
    components: [
      { name: 'basic',                type: 'earning',   amount:  55_000 },
      { name: 'hra',                  type: 'earning',   amount:  22_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   2_500 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_000 },
      { name: 'special_allowance',    type: 'earning',   amount:   8_500 },
      { name: 'provident_fund',       type: 'deduction', amount:   6_600 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:       0 },
    ],
  },
  // Finance Analyst — Monthly gross 120 000 → CTC 1 440 000
  ACmehi2024008: {
    ctc: 1_440_000, effectiveFrom: '2024-07-01',
    components: [
      { name: 'basic',                type: 'earning',   amount:  75_000 },
      { name: 'hra',                  type: 'earning',   amount:  30_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   3_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_000 },
      { name: 'special_allowance',    type: 'earning',   amount:  10_000 },
      { name: 'provident_fund',       type: 'deduction', amount:   9_000 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:   3_500 },
    ],
  },
  // Account Executive — Monthly gross 110 000 → CTC 1 320 000
  ACrota2024009: {
    ctc: 1_320_000, effectiveFrom: '2024-08-01',
    components: [
      { name: 'basic',                type: 'earning',   amount:  70_000 },
      { name: 'hra',                  type: 'earning',   amount:  28_000 },
      { name: 'conveyance_allowance', type: 'earning',   amount:   3_000 },
      { name: 'medical_allowance',    type: 'earning',   amount:   2_000 },
      { name: 'special_allowance',    type: 'earning',   amount:   7_000 },
      { name: 'provident_fund',       type: 'deduction', amount:   8_400 },
      { name: 'professional_tax',     type: 'deduction', amount:   2_500 },
      { name: 'income_tax',           type: 'deduction', amount:   2_500 },
    ],
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱  HRMS seed starting…\n');

  // ── Hash dev password ──────────────────────────────────────────────────
  console.log('  ⟳  Hashing dev password…');
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash('admin@odoo2026', BCRYPT_ROUNDS);

  // Pre-compute dates we will reference throughout
  const workDays    = getLastNWorkingDays(10); // [0]=oldest … [9]=newest
  const today       = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // ── 0. Wipe existing data (reverse dependency order) ──────────────────
  console.log('  ⟳  Clearing existing data…');
  await prisma.salaryComponent.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveAllocation.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.bankDetail.deleteMany();
  await prisma.employeeProfile.deleteMany();
  // Clear self-referential manager FK before deleting users
  await prisma.user.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  // ── 1. Company ────────────────────────────────────────────────────────
  console.log('  ✔  Company');
  const company = await prisma.company.create({
    data: {
      name:    'Acme Corp',
      code:    'AC',
      address: '42, Cyber City, Gurugram, Haryana – 122002',
      phone:   '+91-124-4000000',
      email:   'info@acmecorp.com',
      website: 'https://acmecorp.com',
    },
  });

  // ── 2. Departments ────────────────────────────────────────────────────
  console.log('  ✔  Departments');
  const [engDept, hrDept, finDept, salesDept] = await prisma.$transaction([
    prisma.department.create({ data: { companyId: company.id, name: 'Engineering',     code: 'ENG', description: 'Product development & platform engineering' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Human Resources', code: 'HR',  description: 'People operations & talent acquisition' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Finance',         code: 'FIN', description: 'Accounting, payroll & financial planning' } }),
    prisma.department.create({ data: { companyId: company.id, name: 'Sales',           code: 'SAL', description: 'Business development & account management' } }),
  ]);

  // ── 3. Job Positions ──────────────────────────────────────────────────
  console.log('  ✔  Job Positions');
  const [
    posCTO, posHRD, posEM, posHRBP,
    posSrSWE, posSWE, posJrSWE,
    posFA, posAE,
  ] = await prisma.$transaction([
    prisma.jobPosition.create({ data: { departmentId: engDept.id,   title: 'Chief Technology Officer',  level: 10 } }),
    prisma.jobPosition.create({ data: { departmentId: hrDept.id,    title: 'HR Director',               level:  9 } }),
    prisma.jobPosition.create({ data: { departmentId: engDept.id,   title: 'Engineering Manager',        level:  8 } }),
    prisma.jobPosition.create({ data: { departmentId: hrDept.id,    title: 'HR Business Partner',        level:  5 } }),
    prisma.jobPosition.create({ data: { departmentId: engDept.id,   title: 'Senior Software Engineer',   level:  6 } }),
    prisma.jobPosition.create({ data: { departmentId: engDept.id,   title: 'Software Engineer',          level:  4 } }),
    prisma.jobPosition.create({ data: { departmentId: engDept.id,   title: 'Junior Software Engineer',   level:  2 } }),
    prisma.jobPosition.create({ data: { departmentId: finDept.id,   title: 'Finance Analyst',            level:  4 } }),
    prisma.jobPosition.create({ data: { departmentId: salesDept.id, title: 'Account Executive',          level:  4 } }),
  ]);

  // ── 4. Users — first pass without managerId ───────────────────────────
  console.log('  ✔  Users');
  const [arjun, priya, kiran, rahul, sneha, vikram, anjali, meera, rohan] =
    await prisma.$transaction([
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'admin@odoo2026',
        email: 'arjun.sharma@acmecorp.com', passwordHash: adminPasswordHash, role: 'admin',
        firstName: 'Arjun',  lastName: 'Sharma', phone: '+91-9800000001',
        departmentId: engDept.id,   jobPositionId: posCTO.id,
        hireDate: new Date('2024-01-15'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACprir2024002',
        email: 'priya.nair@acmecorp.com', passwordHash, role: 'hr',
        firstName: 'Priya',  lastName: 'Nair',   phone: '+91-9800000002',
        departmentId: hrDept.id,    jobPositionId: posHRD.id,
        hireDate: new Date('2024-02-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACkias2024003',
        email: 'kiran.das@acmecorp.com', passwordHash, role: 'hr',
        firstName: 'Kiran',  lastName: 'Das',    phone: '+91-9800000003',
        departmentId: hrDept.id,    jobPositionId: posHRBP.id,
        hireDate: new Date('2024-03-15'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACrata2024004',
        email: 'rahul.mehta@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Rahul',  lastName: 'Mehta',  phone: '+91-9800000004',
        departmentId: engDept.id,   jobPositionId: posEM.id,
        hireDate: new Date('2024-03-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACsnel2024005',
        email: 'sneha.patel@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Sneha',  lastName: 'Patel',  phone: '+91-9800000005',
        departmentId: engDept.id,   jobPositionId: posSrSWE.id,
        hireDate: new Date('2024-04-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACvigh2024006',
        email: 'vikram.singh@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Vikram', lastName: 'Singh',  phone: '+91-9800000006',
        departmentId: engDept.id,   jobPositionId: posSWE.id,
        hireDate: new Date('2024-05-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACandy2024007',
        email: 'anjali.reddy@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Anjali', lastName: 'Reddy',  phone: '+91-9800000007',
        departmentId: engDept.id,   jobPositionId: posJrSWE.id,
        hireDate: new Date('2024-06-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACmehi2024008',
        email: 'meera.joshi@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Meera',  lastName: 'Joshi',  phone: '+91-9800000008',
        departmentId: finDept.id,   jobPositionId: posFA.id,
        hireDate: new Date('2024-07-01'),
      }}),
      prisma.user.create({ data: {
        companyId: company.id, loginId: 'ACrota2024009',
        email: 'rohan.gupta@acmecorp.com', passwordHash, role: 'employee',
        firstName: 'Rohan',  lastName: 'Gupta',  phone: '+91-9800000009',
        departmentId: salesDept.id, jobPositionId: posAE.id,
        hireDate: new Date('2024-08-01'),
      }}),
    ]);

  // Second pass — set manager relationships
  await prisma.$transaction([
    prisma.user.update({ where: { id: kiran.id  }, data: { managerId: priya.id } }),
    prisma.user.update({ where: { id: rahul.id  }, data: { managerId: arjun.id } }),
    prisma.user.update({ where: { id: sneha.id  }, data: { managerId: rahul.id } }),
    prisma.user.update({ where: { id: vikram.id }, data: { managerId: rahul.id } }),
    prisma.user.update({ where: { id: anjali.id }, data: { managerId: rahul.id } }),
  ]);

  // Convenience list for batch operations
  const allUsers = [arjun, priya, kiran, rahul, sneha, vikram, anjali, meera, rohan];

  // ── 5. Employee Profiles ──────────────────────────────────────────────
  console.log('  ✔  Employee Profiles');
  await prisma.employeeProfile.createMany({
    data: [
      { userId: arjun.id,  dateOfBirth: new Date('1985-03-12'), gender: 'male',   address: '12, MG Road',       city: 'Bangalore',  state: 'Karnataka',      pincode: '560001', maritalStatus: 'married', emergencyContactName: 'Sunita Sharma',  emergencyContactPhone: '+91-9800001001' },
      { userId: priya.id,  dateOfBirth: new Date('1988-07-22'), gender: 'female', address: '5, Indiranagar',     city: 'Bangalore',  state: 'Karnataka',      pincode: '560038', maritalStatus: 'married', emergencyContactName: 'Rajiv Nair',     emergencyContactPhone: '+91-9800001002' },
      { userId: kiran.id,  dateOfBirth: new Date('1991-12-01'), gender: 'male',   address: '22, Salt Lake',      city: 'Kolkata',    state: 'West Bengal',    pincode: '700091', maritalStatus: 'single',  emergencyContactName: 'Anita Das',      emergencyContactPhone: '+91-9800001003' },
      { userId: rahul.id,  dateOfBirth: new Date('1990-11-05'), gender: 'male',   address: '8, Koramangala',     city: 'Bangalore',  state: 'Karnataka',      pincode: '560034', maritalStatus: 'married', emergencyContactName: 'Sunita Mehta',   emergencyContactPhone: '+91-9800001004' },
      { userId: sneha.id,  dateOfBirth: new Date('1993-02-14'), gender: 'female', address: '34, Baner Road',     city: 'Pune',       state: 'Maharashtra',    pincode: '411045', maritalStatus: 'single',  emergencyContactName: 'Ramesh Patel',   emergencyContactPhone: '+91-9800001005' },
      { userId: vikram.id, dateOfBirth: new Date('1992-09-30'), gender: 'male',   address: '15, Sector 18',      city: 'Noida',      state: 'Uttar Pradesh',  pincode: '201301', maritalStatus: 'married', emergencyContactName: 'Geeta Singh',    emergencyContactPhone: '+91-9800001006' },
      { userId: anjali.id, dateOfBirth: new Date('1999-05-20'), gender: 'female', address: '9, Film Nagar',      city: 'Hyderabad',  state: 'Telangana',      pincode: '500033', maritalStatus: 'single',  emergencyContactName: 'Venkat Reddy',   emergencyContactPhone: '+91-9800001007' },
      { userId: meera.id,  dateOfBirth: new Date('1994-08-17'), gender: 'female', address: '4, Shivaji Park',    city: 'Mumbai',     state: 'Maharashtra',    pincode: '400028', maritalStatus: 'single',  emergencyContactName: 'Suresh Joshi',   emergencyContactPhone: '+91-9800001008' },
      { userId: rohan.id,  dateOfBirth: new Date('1995-04-28'), gender: 'male',   address: '77, C-Scheme',       city: 'Jaipur',     state: 'Rajasthan',      pincode: '302001', maritalStatus: 'single',  emergencyContactName: 'Savita Gupta',   emergencyContactPhone: '+91-9800001009' },
    ],
  });

  // ── 6. Bank Details ───────────────────────────────────────────────────
  console.log('  ✔  Bank Details');
  await prisma.bankDetail.createMany({
    data: [
      { userId: arjun.id,  accountNumber: '12340000000001', bankName: 'HDFC Bank',  ifscCode: 'HDFC0001234', accountType: 'savings' },
      { userId: priya.id,  accountNumber: '12340000000002', bankName: 'ICICI Bank', ifscCode: 'ICIC0002345', accountType: 'savings' },
      { userId: kiran.id,  accountNumber: '12340000000003', bankName: 'SBI',        ifscCode: 'SBIN0003456', accountType: 'savings' },
      { userId: rahul.id,  accountNumber: '12340000000004', bankName: 'HDFC Bank',  ifscCode: 'HDFC0004567', accountType: 'savings' },
      { userId: sneha.id,  accountNumber: '12340000000005', bankName: 'Axis Bank',  ifscCode: 'UTIB0005678', accountType: 'savings' },
      { userId: vikram.id, accountNumber: '12340000000006', bankName: 'Kotak Bank', ifscCode: 'KKBK0006789', accountType: 'savings' },
      { userId: anjali.id, accountNumber: '12340000000007', bankName: 'SBI',        ifscCode: 'SBIN0007890', accountType: 'savings' },
      { userId: meera.id,  accountNumber: '12340000000008', bankName: 'ICICI Bank', ifscCode: 'ICIC0008901', accountType: 'savings' },
      { userId: rohan.id,  accountNumber: '12340000000009', bankName: 'HDFC Bank',  ifscCode: 'HDFC0009012', accountType: 'savings' },
    ],
  });

  // ── 7. Skills (3 employees × 2-3 skills each) ─────────────────────────
  console.log('  ✔  Skills');
  await prisma.skill.createMany({
    data: [
      // Sneha — 3 skills
      { userId: sneha.id,  name: 'TypeScript',    proficiency: 'expert'       },
      { userId: sneha.id,  name: 'React',          proficiency: 'expert'       },
      { userId: sneha.id,  name: 'Node.js',        proficiency: 'advanced'     },
      // Vikram — 3 skills
      { userId: vikram.id, name: 'Python',         proficiency: 'advanced'     },
      { userId: vikram.id, name: 'PostgreSQL',     proficiency: 'intermediate' },
      { userId: vikram.id, name: 'Docker',         proficiency: 'intermediate' },
      // Rahul — 3 skills
      { userId: rahul.id,  name: 'System Design',  proficiency: 'expert'       },
      { userId: rahul.id,  name: 'Agile / Scrum',  proficiency: 'expert'       },
      { userId: rahul.id,  name: 'Go',             proficiency: 'advanced'     },
      // Anjali — 2 skills
      { userId: anjali.id, name: 'JavaScript',     proficiency: 'intermediate' },
      { userId: anjali.id, name: 'Git',            proficiency: 'beginner'     },
    ],
  });

  // ── 8. Certifications (3 employees × 1-2 certs) ───────────────────────
  console.log('  ✔  Certifications');
  await prisma.certification.createMany({
    data: [
      // Sneha — 2 certs
      { userId: sneha.id,  name: 'AWS Solutions Architect – Associate', issuingOrg: 'Amazon Web Services', issueDate: new Date('2023-06-15'), expiryDate: new Date('2026-06-15'), credentialId: 'AWS-SAA-SN001' },
      { userId: sneha.id,  name: 'Meta React Developer Certificate',    issuingOrg: 'Meta / Coursera',     issueDate: new Date('2022-09-01'), expiryDate: null,                  credentialId: 'META-REACT-SN001' },
      // Vikram — 1 cert
      { userId: vikram.id, name: 'Google Professional Data Engineer',   issuingOrg: 'Google Cloud',        issueDate: new Date('2024-01-20'), expiryDate: new Date('2026-01-20'), credentialId: 'GCP-PDE-VS001' },
      // Rahul — 2 certs
      { userId: rahul.id,  name: 'Project Management Professional (PMP)', issuingOrg: 'PMI',               issueDate: new Date('2022-03-10'), expiryDate: new Date('2025-03-10'), credentialId: 'PMP-RM001' },
      { userId: rahul.id,  name: 'Certified Kubernetes Administrator',   issuingOrg: 'CNCF',               issueDate: new Date('2023-09-05'), expiryDate: new Date('2026-09-05'), credentialId: 'CKA-RM001' },
    ],
  });

  // ── 9. Attendance — last 10 working days, varied patterns ────────────
  console.log('  ✔  Attendance (10 working days × 9 employees)');
  const attendanceRows = allUsers.flatMap((u) => {
    const pattern = PATTERNS[u.loginId];
    return workDays.map((day, i) => {
      const p = pattern[i];
      const hasCheckIn  = p.inH  !== undefined && p.inM  !== undefined;
      const hasCheckOut = p.outH !== undefined && p.outM !== undefined;
      return {
        userId:   u.id,
        date:     day,
        checkIn:  hasCheckIn  ? ts(day, p.inH!,  p.inM!)  : null,
        checkOut: hasCheckOut ? ts(day, p.outH!, p.outM!) : null,
        status:   p.status as AttendanceStatus,
        note:     p.note ?? null,
      };
    });
  });
  await prisma.attendance.createMany({ data: attendanceRows, skipDuplicates: true });

  // ── 10. Leave Types ───────────────────────────────────────────────────
  console.log('  ✔  Leave Types');
  const [pto, sick, unpaid] = await prisma.$transaction([
    prisma.leaveType.create({ data: { name: 'Paid Time Off', description: 'Annual paid leave entitlement',             isPaid: true,  maxDaysPerYear: 15 } }),
    prisma.leaveType.create({ data: { name: 'Sick Leave',    description: 'Leave for illness or medical appointments',  isPaid: true,  maxDaysPerYear: 10 } }),
    prisma.leaveType.create({ data: { name: 'Unpaid Leave',  description: 'Leave without pay for personal reasons',     isPaid: false, maxDaysPerYear: 30 } }),
  ]);

  // ── 11. Leave Allocations (all users × all 3 types, current year) ────
  console.log('  ✔  Leave Allocations');
  const allocData = allUsers.flatMap((u) => [
    { userId: u.id, leaveTypeId: pto.id,    year: currentYear, totalDays: 15, usedDays: 0 },
    { userId: u.id, leaveTypeId: sick.id,   year: currentYear, totalDays: 10, usedDays: 0 },
    { userId: u.id, leaveTypeId: unpaid.id, year: currentYear, totalDays: 30, usedDays: 0 },
  ]);
  // Reflect consumed days for the 2 approved leaves (see step 12)
  const rahulSickAlloc = allocData.find(a => a.userId === rahul.id && a.leaveTypeId === sick.id)!;
  const meeraPTOAlloc  = allocData.find(a => a.userId === meera.id && a.leaveTypeId === pto.id)!;
  rahulSickAlloc.usedDays = 1;
  meeraPTOAlloc.usedDays  = 3;
  await prisma.leaveAllocation.createMany({ data: allocData, skipDuplicates: true });

  // ── 12. Leave Requests ────────────────────────────────────────────────
  //   Approved: Rahul (sick, 1 day = workDays[4]) + Meera (PTO, 3 days = workDays[6-8])
  //   Pending:  Sneha (PTO 5d), Vikram (Sick 2d), Anjali (PTO 3d)
  console.log('  ✔  Leave Requests (2 approved, 3 pending)');

  const rahulLeaveDay   = workDays[4];
  const meeraLeaveStart = workDays[6];
  const meeraLeaveEnd   = workDays[8];

  const dayBefore = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - 1); return x; };

  await prisma.leaveRequest.createMany({
    data: [
      // ── 2 Approved ──────────────────────────────────────────────────────
      {
        userId: rahul.id, leaveTypeId: sick.id,
        startDate: rahulLeaveDay, endDate: rahulLeaveDay, daysCount: 1,
        reason: 'High fever — doctor advised rest.',
        status: 'approved',
        reviewedById: priya.id, reviewedAt: dayBefore(rahulLeaveDay),
        reviewerNote: 'Approved. Get well soon.',
      },
      {
        userId: meera.id, leaveTypeId: pto.id,
        startDate: meeraLeaveStart, endDate: meeraLeaveEnd, daysCount: 3,
        reason: "Family function — sister's wedding.",
        status: 'approved',
        reviewedById: priya.id, reviewedAt: dayBefore(meeraLeaveStart),
        reviewerNote: 'Approved. Congratulations!',
      },
      // ── 3 Pending ────────────────────────────────────────────────────────
      {
        userId: sneha.id, leaveTypeId: pto.id,
        startDate: addWorkingDays(today,  7),
        endDate:   addWorkingDays(today, 11),
        daysCount: 5, reason: 'Planned family vacation.',
        status: 'pending',
      },
      {
        userId: vikram.id, leaveTypeId: sick.id,
        startDate: addWorkingDays(today, 3),
        endDate:   addWorkingDays(today, 4),
        daysCount: 2, reason: 'Scheduled medical procedure.',
        status: 'pending',
      },
      {
        userId: anjali.id, leaveTypeId: pto.id,
        startDate: addWorkingDays(today, 14),
        endDate:   addWorkingDays(today, 16),
        daysCount: 3, reason: 'Personal travel.',
        status: 'pending',
      },
    ],
  });

  // ── 13. Salary Structures + Components ───────────────────────────────
  console.log('  ✔  Salary Structures & Components');
  for (const u of allUsers) {
    const sd = SALARY[u.loginId];
    await prisma.salaryStructure.create({
      data: {
        userId:        u.id,
        effectiveFrom: new Date(sd.effectiveFrom),
        ctc:           sd.ctc,
        isActive:      true,
        components: {
          create: sd.components.map((c) => ({
            name:   c.name   as SalaryComponentName,
            type:   c.type   as CompensationType,
            amount: c.amount,
          })),
        },
      },
    });
  }

  // ── 14. Print Credentials ─────────────────────────────────────────────
  const creds = [
    { role: 'admin',    loginId: 'admin@odoo2026', name: 'Arjun Sharma'  },
    { role: 'hr',       loginId: 'ACprir2024002', name: 'Priya Nair'    },
    { role: 'hr',       loginId: 'ACkias2024003', name: 'Kiran Das'     },
    { role: 'employee', loginId: 'ACrata2024004', name: 'Rahul Mehta'   },
    { role: 'employee', loginId: 'ACsnel2024005', name: 'Sneha Patel'   },
    { role: 'employee', loginId: 'ACvigh2024006', name: 'Vikram Singh'  },
    { role: 'employee', loginId: 'ACandy2024007', name: 'Anjali Reddy'  },
    { role: 'employee', loginId: 'ACmehi2024008', name: 'Meera Joshi'   },
    { role: 'employee', loginId: 'ACrota2024009', name: 'Rohan Gupta'   },
  ];

  const SEP = '─'.repeat(67);
  console.log(`\n┌${SEP}┐`);
  console.log(`│${'  🔑  SEEDED USER CREDENTIALS'.padEnd(67)}│`);
  console.log(`├${'─'.repeat(12)}┬${'─'.repeat(17)}┬${'─'.repeat(13)}┬${'─'.repeat(23)}┤`);
  console.log(`│ ${'Role'.padEnd(10)} │ ${'Login ID'.padEnd(15)} │ ${'Password'.padEnd(11)} │ ${'Full Name'.padEnd(21)} │`);
  console.log(`├${'─'.repeat(12)}┼${'─'.repeat(17)}┼${'─'.repeat(13)}┼${'─'.repeat(23)}┤`);
  for (const c of creds) {
    const pwd = c.loginId === 'admin@odoo2026' ? 'admin@odoo2026' : DEV_PASSWORD;
    console.log(
      `│ ${c.role.padEnd(10)} │ ${c.loginId.padEnd(15)} │ ${pwd.padEnd(11)} │ ${c.name.padEnd(21)} │`,
    );
  }
  console.log(`└${'─'.repeat(12)}┴${'─'.repeat(17)}┴${'─'.repeat(13)}┴${'─'.repeat(23)}┘\n`);
  console.log('✅  Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('\n❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
