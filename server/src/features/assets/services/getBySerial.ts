import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetAssetSerialParams } from '../../../types/index.js'

export async function getBySerial({ serialNumber }: GetAssetSerialParams) {
  const asset = await db
    .select()
    .from(assetTab)
    .where(eq(assetTab.serialNumber, serialNumber))

  if (asset.length === 0) {
    throw new NotFoundError(
      `${ERROR_MESSAGES.ASSET_SN_NOT_FOUND} SN: ${serialNumber}`
    )
  }

  const assetDetails = asset.map(a => ({
    id: a.id,
    serialNumber: a.serialNumber,
    name: a.name,
    type: a.type,
    maker: a.maker,
    condition: a.condition,
    assignedTo: a.assignedTo,
    datePurchased: a.datePurchased,
    assetNumber: a.assetNumber,
    status: a.status,
    note: a.note,
    createdAt: a.createdAt,
    createdBy: a.createdBy,
  }))

  return { success: true, message: 'Asset list retrieved successfully', assetDetails }
}
