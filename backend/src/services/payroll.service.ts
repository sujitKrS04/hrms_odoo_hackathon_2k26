/**
 * backend/src/services/payroll.service.ts
 * Block 7 — GET and PUT /api/payroll/:userId
 *
 * Auto-calculation: client sends CTC + percentages → server computes monthly
 * component amounts. Client-submitted amounts are ignored / overwritten.
 *
 * Standard Indian payroll formula (all monthly amounts):
 *   basic           = monthlyGross × basicPct / 100        (default 40%)
 *   hra             = basic         × hraPct  / 100        (default 40% of basic)
 *   conveyance      = conveyanceFixed                      (default ₹1 600)
 *   medical         = medicalFixed                         (default ₹1 250)
 *   special         = monthlyGross - basic - hra - conveyance - medical (remainder)
 *   provident_fund  = basic         × pfPct   / 100        (default 12%)
 *   professional_tax = profTax                             (default ₹200)
 *   income_tax      = incomeTax                            (default 0)
 *   net_monthly     = monthlyGross - pf - profTax - incomeTax
 */
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/prisma';
import { canManage } from '../utils/permissions';
import { ApiError } from '../utils/ApiError';
import type { SalaryComponentName, CompensationType, UserRole } from '@prisma/client';

// ─── Payroll calculation ──────────────────────────────────────────────────────

export interface PayrollInput {
  ctc:              number;   // annual, INR
  effectiveFrom:    string;   // ISO date string
  basicPct?:        number;   // % of monthly gross, default 40
  hraPct?:          number;   // % of basic,         default 40
  conveyanceFixed?: number;   // monthly fixed,       default 1600
  medicalFixed?:    number;   // monthly fixed,       default 1250
  pfPct?:           number;   // % of basic,          default 12
  professionalTax?: number;   // monthly fixed slab,  default 200
  incomeTax?:       number;   // monthly TDS,         default 0
}

interface ComponentRow {
  name:   SalaryComponentName;
  type:   CompensationType;
  amount: number;
}

function computeComponents(input: PayrollInput): {
  components: ComponentRow[];
  monthlyGross: number;
  monthlyNet: number;
} {
  const monthlyGross = +(input.ctc / 12).toFixed(2);

  const basicPct       = input.basicPct        ?? 40;
  const hraPct         = input.hraPct          ?? 40;
  const conveyance     = input.conveyanceFixed  ?? 1600;
  const medical        = input.medicalFixed     ?? 1250;
  const pfPct          = input.pfPct            ?? 12;
  const profTax        = input.professionalTax  ?? 200;
  const incomeTax      = input.incomeTax        ?? 0;

  const basic          = +(monthlyGross * basicPct / 100).toFixed(2);
  const hra            = +(basic * hraPct / 100).toFixed(2);
  const special        = +(monthlyGross - basic - hra - conveyance - medical).toFixed(2);
  const pf             = +(basic * pfPct / 100).toFixed(2);

  if (special < 0) {
    throw new ApiError(
      400,
      'Special allowance computed negative. Reduce conveyance/medical fixed amounts or increase CTC.',
    );
  }

  const monthlyNet = +(monthlyGross - pf - profTax - incomeTax).toFixed(2);

  const components: ComponentRow[] = [
    { name: 'basic',                type: 'earning',   amount: basic      },
    { name: 'hra',                  type: 'earning',   amount: hra        },
    { name: 'conveyance_allowance', type: 'earning',   amount: conveyance },
    { name: 'medical_allowance',    type: 'earning',   amount: medical    },
    { name: 'special_allowance',    type: 'earning',   amount: special    },
    { name: 'provident_fund',       type: 'deduction', amount: pf         },
    { name: 'professional_tax',     type: 'deduction', amount: profTax    },
    { name: 'income_tax',           type: 'deduction', amount: incomeTax  },
  ];

  return { components, monthlyGross, monthlyNet };
}

// ─── Access guard ─────────────────────────────────────────────────────────────

async function resolvePayrollTarget(
  targetUserId: string,
  actor: { id: string; role: UserRole; companyId: string },
) {
  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: actor.companyId },
    select: { id: true, role: true, firstName: true, lastName: true },
  });
  if (!target) throw new ApiError(404, 'Employee not found.');
  return target;
}

// ─── GET /api/payroll/:userId ─────────────────────────────────────────────────

export async function getPayroll(
  actor: { id: string; role: UserRole; companyId: string },
  targetUserId: string,
) {
  const target = await resolvePayrollTarget(targetUserId, actor);
  const isSelf = actor.id === targetUserId;

  // Access rules
  if (actor.role === 'employee' && !isSelf) {
    throw new ApiError(403, 'Employees can only view their own payroll.');
  }
  if (!isSelf && !canManage(actor.role, target.role)) {
    throw new ApiError(403, 'You do not have permission to view this payroll.');
  }

  const structure = await prisma.salaryStructure.findUnique({
    where: { userId: targetUserId },
    include: { components: { orderBy: { type: 'asc' } } },
  });
  if (!structure) throw new ApiError(404, 'No salary structure found for this employee.');

  // Compute derived values
  const earnings   = structure.components
    .filter(c => c.type === 'earning')
    .reduce((s, c) => s + Number(c.amount), 0);
  const deductions = structure.components
    .filter(c => c.type === 'deduction')
    .reduce((s, c) => s + Number(c.amount), 0);

  return {
    structure: {
      id:            structure.id,
      ctc:           Number(structure.ctc),
      effectiveFrom: structure.effectiveFrom,
      isActive:      structure.isActive,
    },
    components:       structure.components,
    monthlyGross:     +earnings.toFixed(2),
    monthlyDeductions:+deductions.toFixed(2),
    monthlyNet:       +(earnings - deductions).toFixed(2),
    annualCTC:        Number(structure.ctc),
  };
}

// ─── PUT /api/payroll/:userId ─────────────────────────────────────────────────

export async function updatePayroll(
  actor: { id: string; role: UserRole; companyId: string },
  targetUserId: string,
  input: PayrollInput,
) {
  const target = await resolvePayrollTarget(targetUserId, actor);
  const isSelf = actor.id === targetUserId;

  // Employees cannot write payroll (not even their own)
  if (actor.role === 'employee') {
    throw new ApiError(403, 'Employees cannot modify payroll structures.');
  }
  // Cross-user write: canManage check
  if (!isSelf && !canManage(actor.role, target.role)) {
    throw new ApiError(403, 'You do not have permission to update this payroll.');
  }
  // HR cannot write HR payroll (only admin can)
  if (actor.role === 'hr' && target.role !== 'employee') {
    throw new ApiError(403, 'HR can only update employee payroll structures.');
  }

  const { components, monthlyGross, monthlyNet } = computeComponents(input);

  // Upsert salary_structure + replace all components atomically
  const structure = await prisma.$transaction(async (tx) => {
    // Find or create structure
    const existing = await tx.salaryStructure.findUnique({ where: { userId: targetUserId } });

    let structureId: string;

    if (existing) {
      await tx.salaryStructure.update({
        where: { userId: targetUserId },
        data: {
          ctc:           new Decimal(input.ctc),
          effectiveFrom: new Date(input.effectiveFrom),
          isActive:      true,
        },
      });
      structureId = existing.id;
      // Delete old components
      await tx.salaryComponent.deleteMany({ where: { salaryStructureId: structureId } });
    } else {
      const created = await tx.salaryStructure.create({
        data: {
          userId:        targetUserId,
          ctc:           new Decimal(input.ctc),
          effectiveFrom: new Date(input.effectiveFrom),
          isActive:      true,
        },
      });
      structureId = created.id;
    }

    // Insert fresh components (server-computed, not client amounts)
    await tx.salaryComponent.createMany({
      data: components.map(c => ({
        salaryStructureId: structureId,
        name:              c.name,
        type:              c.type,
        amount:            new Decimal(c.amount),
      })),
    });

    return tx.salaryStructure.findUniqueOrThrow({
      where:   { id: structureId },
      include: { components: { orderBy: { type: 'asc' } } },
    });
  });

  return {
    structure: {
      id:            structure.id,
      ctc:           Number(structure.ctc),
      effectiveFrom: structure.effectiveFrom,
      isActive:      structure.isActive,
    },
    components:        structure.components,
    monthlyGross:      +monthlyGross.toFixed(2),
    monthlyNet:        +monthlyNet.toFixed(2),
    annualCTC:         input.ctc,
  };
}
