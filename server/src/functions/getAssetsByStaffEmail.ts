import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { ERROR_MESSAGES, NotFoundError } from '../errors'
import type { GetAssetParams } from '../types'

export async function getAssetsByStaffEmail({ staffEmail }: GetAssetParams) {
  const asset = await db
    .select()
    .from(assetTab)
    .where(eq(assetTab.assignedTo, staffEmail))

  if (asset.length === 0) {
    throw new NotFoundError(
      `${ERROR_MESSAGES.STAFF_ASSETS_NOT_FOUND} Email: ${staffEmail}`
    )
  }

  const assetList = asset.map(asset => {
    return {
      id: asset.id,
      serialNumber: asset.serialNumber,
      name: asset.name,
      email: asset.assignedTo,
    }
  })

  return {
    success: true,
    message: 'Asset list retrieved successfully',
    assetList,
  }
}
