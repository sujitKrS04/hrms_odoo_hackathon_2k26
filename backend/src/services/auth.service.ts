/**
 * backend/src/services/auth.service.ts
 *
 * All authentication business logic lives here.
 * Controllers call these functions and handle HTTP responses.
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { signToken } from '../utils/jwt';
import { generateLoginId } from '../utils/loginId';
import { canManage } from '../utils/permissions';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a short company code from the company name (first 2 letters, UPPERCASE) */
function deriveCompanyCode(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Generates a random 12-char alphanumeric system password.
 * Returned in plaintext ONCE to the caller; never stored or logged.
 */
function generateSystemPassword(): string {
  // Ensure at least one digit (password strength requirement)
  const letters = crypto.randomBytes(9).toString('base64url').slice(0, 9);
  const digits = String(Math.floor(Math.random() * 900) + 100); // 3 digits
  return letters + digits; // e.g. "aB3xYmQpR914"
}

// ─── Service: Signup (company + admin) ───────────────────────────────────────

export interface SignupInput {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResult {
  token: string;
  user: {
    id: string;
    loginId: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
    companyId: string;
    companyName: string;
  };
}

export async function signup(input: SignupInput): Promise<SignupResult> {
  // ── Guard: email uniqueness ───────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.', 'email');
  }

  // ── Guard: company name uniqueness ────────────────────────────────────
  const existingCompany = await prisma.company.findUnique({
    where: { name: input.companyName.trim() },
  });
  if (existingCompany) {
    throw new ApiError(
      409,
      'A company with this name already exists.',
      'companyName',
    );
  }

  // ── Derive company code (unique-ify if collision) ─────────────────────
  let code = deriveCompanyCode(input.companyName);
  if (!code || code.length < 1) code = 'CO';

  // Ensure code uniqueness by appending a counter suffix
  let suffix = 0;
  let finalCode = code;
  while (await prisma.company.findUnique({ where: { code: finalCode } })) {
    suffix++;
    finalCode = code + suffix;
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const hireDate     = new Date();
  const hireYear     = hireDate.getFullYear();

  // ── Atomic transaction: company + admin user ──────────────────────────
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name:  input.companyName.trim(),
        code:  finalCode,
        email: input.companyEmail,
        phone: input.companyPhone,
      },
    });

    // Serial = 1 (first user in this company)
    const loginId = generateLoginId(
      finalCode,
      input.firstName,
      input.lastName,
      hireYear,
      1,
    );

    const user = await tx.user.create({
      data: {
        companyId:    company.id,
        loginId,
        email:        input.email.toLowerCase().trim(),
        passwordHash,
        role:         'admin',
        firstName:    input.firstName.trim(),
        lastName:     input.lastName.trim(),
        hireDate,
        mustChangePassword: false, // self-registered admin chose their own password
      },
    });

    return { company, user };
  });

  const token = signToken({
    id:        result.user.id,
    role:      result.user.role,
    companyId: result.user.companyId,
  });

  return {
    token,
    user: {
      id:                 result.user.id,
      loginId:            result.user.loginId,
      email:              result.user.email,
      role:               result.user.role,
      firstName:          result.user.firstName,
      lastName:           result.user.lastName,
      mustChangePassword: result.user.mustChangePassword,
      companyId:          result.user.companyId,
      companyName:        result.company.name,
    },
  };
}

// ─── Service: Create user (admin/hr creates hr or employee) ──────────────────

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  jobPositionId?: string;
  managerId?: string;
  phone?: string;
}

export interface CreateUserResult {
  user: {
    id: string;
    loginId: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
  };
  /** Plaintext — return once to caller, never log or persist */
  generatedPassword: string;
}

export async function createUser(
  actorId: string,
  actorRole: UserRole,
  actorCompanyId: string,
  input: CreateUserInput,
): Promise<CreateUserResult> {
  // ── Permission: canManage enforces role hierarchy ─────────────────────
  if (!canManage(actorRole, input.role)) {
    throw new ApiError(
      403,
      `A user with role '${actorRole}' cannot create a '${input.role}' account.`,
    );
  }

  // ── Guard: email uniqueness ───────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.', 'email');
  }

  // ── Validate departmentId belongs to actor's company (if provided) ────
  if (input.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: input.departmentId, companyId: actorCompanyId },
    });
    if (!dept) {
      throw new ApiError(404, 'Department not found in your company.', 'departmentId');
    }
  }

  // ── Determine serial: count existing users in company + 1 ─────────────
  const existingCount = await prisma.user.count({
    where: { companyId: actorCompanyId },
  });

  const hireDate = new Date();
  const hireYear = hireDate.getFullYear();

  // Fetch company code for login ID
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: actorCompanyId },
    select: { code: true },
  });

  const loginId = generateLoginId(
    company.code,
    input.firstName,
    input.lastName,
    hireYear,
    existingCount + 1,
  );

  const generatedPassword = generateSystemPassword();
  const passwordHash      = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      companyId:    actorCompanyId,
      loginId,
      email:        input.email.toLowerCase().trim(),
      passwordHash,
      role:         input.role,
      firstName:    input.firstName.trim(),
      lastName:     input.lastName.trim(),
      phone:        input.phone,
      departmentId: input.departmentId,
      jobPositionId: input.jobPositionId,
      managerId:    input.managerId,
      hireDate,
      mustChangePassword: true, // system-generated password — must change on first login
    },
  });

  return {
    user: {
      id:                 user.id,
      loginId:            user.loginId,
      email:              user.email,
      role:               user.role,
      firstName:          user.firstName,
      lastName:           user.lastName,
      mustChangePassword: user.mustChangePassword,
    },
    generatedPassword,
  };
}

// ─── Service: Login ───────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    loginId: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    companyId: string;
  };
}

/**
 * SECURITY: Use the same generic error message for wrong email AND wrong
 * password — never reveal whether the email exists in the system.
 */
const INVALID_CREDS_MSG =
  'Invalid credentials. Please check your email and password.';

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
    select: {
      id:                 true,
      loginId:            true,
      email:              true,
      role:               true,
      firstName:          true,
      lastName:           true,
      passwordHash:       true,
      companyId:          true,
      isActive:           true,
      mustChangePassword: true,
    },
  });

  // Constant-time compare to prevent timing attacks
  // (always run bcrypt even if user not found, using a dummy hash)
  const DUMMY_HASH =
    '$2b$12$dummyhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXXXXX';
  const isValid = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !isValid) {
    throw new ApiError(401, INVALID_CREDS_MSG);
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact your administrator.');
  }

  const token = signToken({
    id:        user.id,
    role:      user.role,
    companyId: user.companyId,
  });

  return {
    token,
    mustChangePassword: user.mustChangePassword,
    user: {
      id:        user.id,
      loginId:   user.loginId,
      email:     user.email,
      role:      user.role,
      firstName: user.firstName,
      lastName:  user.lastName,
      companyId: user.companyId,
    },
  };
}

// ─── Service: Change password ─────────────────────────────────────────────────

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId },
    select: { passwordHash: true },
  });

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError(400, 'Current password is incorrect.', 'currentPassword');
  }

  if (input.newPassword === input.currentPassword) {
    throw new ApiError(
      400,
      'New password must be different from your current password.',
      'newPassword',
    );
  }

  const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      passwordHash:       newHash,
      mustChangePassword: false,
    },
  });
}
