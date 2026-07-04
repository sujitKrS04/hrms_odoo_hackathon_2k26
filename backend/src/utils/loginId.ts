/**
 * backend/src/utils/loginId.ts
 *
 * Generates deterministic login IDs in the company-standard format:
 *   <companyInitials> + first2(firstName) + first2(lastName) + hireYear + 4-digit serial
 *
 * Format per spec:
 *   LOI  = first letter of EACH word in the company name  (e.g. "Acme Corp" → "AC")
 *   JODO = first 2 letters of first name + first 2 letters of last name
 *   year = 4-digit year of joining
 *   serial = 4-digit zero-padded serial (0001, 0002, …)
 *
 * Examples:
 *   generateLoginId('AC', 'Arjun',  'Sharma', 2026, 1)  → 'ACARSH20260001'
 *   generateLoginId('AC', 'Priya',  'Nair',   2026, 2)  → 'ACPRNA20260002'
 *   generateLoginId('AC', 'Vikram', 'Singh',  2026, 6)  → 'ACVISI20260006'
 *   generateLoginId('OI', 'John',   'Doe',    2022, 1)  → 'OIJODO20220001'  ← spec example
 */

/**
 * @param companyInitials  First letter of each word in company name (e.g. 'AC' for 'Acme Corp')
 * @param firstName        Employee's first name
 * @param lastName         Employee's last name
 * @param hireYear         4-digit year of hire
 * @param serial           Unique sequential number within the company (1-9999)
 */
export function generateLoginId(
  companyInitials: string,
  firstName: string,
  lastName: string,
  hireYear: number,
  serial: number,
): string {
  if (serial < 1 || serial > 9999) {
    throw new RangeError(`serial must be between 1 and 9999, got ${serial}`);
  }

  const first2  = firstName.slice(0, 2).toUpperCase();  // first 2 of first name
  const last2   = lastName.slice(0, 2).toUpperCase();   // first 2 of last name
  const serial4 = String(serial).padStart(4, '0');      // 4-digit zero-padded

  return `${companyInitials.toUpperCase()}${first2}${last2}${hireYear}${serial4}`;
}

/**
 * Derives company initials from a company name:
 * takes the first letter of each word and uppercases it.
 * e.g. "Acme Corp" → "AC",  "Odoo India" → "OI",  "Tech Solutions Ltd" → "TSL"
 */
export function deriveCompanyInitials(companyName: string): string {
  return companyName
    .trim()
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Derives the next available serial by querying how many users already exist
 * in the company and adding 1. Call this from the user-creation service.
 *
 * @param existingCount  Number of users currently in the company
 */
export function nextSerial(existingCount: number): number {
  return existingCount + 1;
}
