import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { ERROR_MESSAGES, NotFoundError } from '../errors'
import type { GetAssetSerialParams } from '../types'

export async function getAssetBySerial({ serialNumber }: GetAssetSerialParams) {
  const asset = await db
    .select()
    .from(assetTab)
    .where(eq(assetTab.serialNumber, serialNumber))

  if (asset.length === 0) {
    throw new NotFoundError(
      `${ERROR_MESSAGES.ASSET_SN_NOT_FOUND} SN: ${serialNumber}`
    )
  }

  const assetList = asset.map(asset => {
    return {
      id: asset.id,
      serialNumber: asset.serialNumber,
      name: asset.name,
      type: asset.type,
      maker: asset.maker,
      assignedTo: asset.assignedTo,
      datePurchased: asset.datePurchased,
      assetNumber: asset.assetNumber,
      status: asset.status,
      note: asset.note,
      createdAt: asset.createdAt,
      createdBy: asset.createdBy,
    }
  })
  return {
    success: true,
    message: 'Asset list retrieved successfully',
    assetList,
  }
}
