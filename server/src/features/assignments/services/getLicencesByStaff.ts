import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetLicencesByStaffParams } from '../../../types/index.js'

export async function getLicencesByStaff({
  staffEmail,
}: GetLicencesByStaffParams) {
  const staff = await db
    .select({ id: staffTab.id })
    .from(staffTab)
    .where(eq(staffTab.email, staffEmail))
    .limit(1)

  if (staff.length === 0) {
    throw new NotFoundError(
      `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${staffEmail}`
    )
  }

  const licence = await db
    .select()
    .from(licenceTab)
    .where(eq(licenceTab.assignedTo, staffEmail))

  const licenceList = licence.map(l => ({
    id: l.id,
    licenceNumber: l.licenceNumber,
    name: l.name,
  }))

  return {
    success: true,
    message: 'Licence list retrieved successfully',
    licenceList,
  }
}
