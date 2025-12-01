import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError } from '../../errors/errorTypes'

export async function getAsset() {
  try {
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

    const allAsset = query.map(asset => {
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
          updatedAt: Date
          updatedField: string
          previousValue: string
          newValue: string
        }>,
      }
    })
    return {
      allAsset,
    }
  } catch (error) {
    console.error('Error fetching assets:', error)
    throw new DatabaseError(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, error)
  }
}
