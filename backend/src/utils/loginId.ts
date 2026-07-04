/**
 * backend/src/utils/loginId.ts
 *
 * Generates deterministic login IDs in the company-standard format:
 *   <companyCode> + first2(firstName) + last2(lastName) + hireYear + 3-digit serial
 *
 * Examples:
 *   generateLoginId('AC', 'Arjun',  'Sharma', 2024, 1)  → 'ACarma2024001'
 *   generateLoginId('AC', 'Priya',  'Nair',   2024, 2)  → 'ACprir2024002'
 *   generateLoginId('AC', 'Vikram', 'Singh',  2024, 6)  → 'ACvigh2024006'
 */

/**
 * @param companyCode  Company code stored in companies.code  (e.g. 'AC')
 * @param firstName    Employee's first name
 * @param lastName     Employee's last name
 * @param hireYear     4-digit year of hire
 * @param serial       Unique sequential number within the company (1-999)
 */
export function generateLoginId(
  companyCode: string,
  firstName: string,
  lastName: string,
  hireYear: number,
  serial: number,
): string {
  if (serial < 1 || serial > 999) {
    throw new RangeError(`serial must be between 1 and 999, got ${serial}`);
  }

  const first2 = firstName.slice(0, 2).toLowerCase();
  const last2  = lastName.slice(-2).toLowerCase();
  const serial3 = String(serial).padStart(3, '0');

  return `${companyCode}${first2}${last2}${hireYear}${serial3}`;
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
