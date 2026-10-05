import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetAssetParams } from '../../../types/index.js'

export async function getByStaff({ staffEmail }: GetAssetParams) {
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

  const asset = await db
    .select()
    .from(assetTab)
    .where(eq(assetTab.assignedTo, staffEmail))

  const assetList = asset.map(a => ({
    id: a.id,
    serialNumber: a.serialNumber,
    name: a.name,
  }))

  return {
    success: true,
    message: 'Asset list retrieved successfully',
    assetList,
  }
}
