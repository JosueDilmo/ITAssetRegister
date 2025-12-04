import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { ERROR_MESSAGES, NotFoundError } from '../errors'
import type { GetByIdParams } from '../types'

export async function getAssetById({ id }: GetByIdParams) {
  const assetQuery = await db
    .select({
      id: assetTab.id,
      serialNumber: assetTab.serialNumber,
      name: assetTab.name,
      type: assetTab.type,
      maker: assetTab.maker,
      assignedTo: assetTab.assignedTo,
      dateAssigned: assetTab.dateAssigned,
      datePurchased: assetTab.datePurchased,
      assetNumber: assetTab.assetNumber,
      status: assetTab.status,
      note: assetTab.note,
      createdAt: assetTab.createdAt,
      createdBy: assetTab.createdBy,
      changeLog: assetTab.changeLog,
    })
    .from(assetTab)
    .where(eq(assetTab.id, id))

  if (assetQuery.length === 0) {
    throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${id}`)
  }

  const asset = assetQuery.map(asset => {
    return {
      id: asset.id,
      serialNumber: asset.serialNumber,
      name: asset.name,
      type: asset.type,
      maker: asset.maker,
      assignedTo: asset.assignedTo,
      dateAssigned: asset.dateAssigned,
      datePurchased: asset.datePurchased,
      assetNumber: asset.assetNumber,
      status: asset.status,
      note: asset.note,
      createdAt: asset.createdAt,
      createdBy: asset.createdBy,
      changeLog: asset.changeLog as Array<{
        updatedBy: string
        updatedAt: string
        updatedField: string
        previousValue: string
        newValue: string
      }>,
    }
  })
  return {
    asset,
  }
}
