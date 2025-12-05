import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { DatabaseError, ERROR_MESSAGES } from '../errors'

export async function getAsset() {
  const query = await db
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

  if (query.length === 0) {
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
  }
  const assetList = query.map(asset => {
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
        previousValue: string[]
        newValue: string[]
      }>,
    }
  })
  return { assetList }
}
