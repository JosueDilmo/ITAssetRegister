import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError } from '../../errors/errorTypes'
import type { GetAssetParams } from '../../types'

export async function getAssetsByStaffEmail({ staffEmail }: GetAssetParams) {
  try {
    const asset = await db
      .select()
      .from(assetTab)
      .where(eq(assetTab.assignedTo, staffEmail))

    if (asset.length === 0) {
      return {
        success: false,
        message: 'No asset found',
        assetList: [],
      }
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
  } catch (error) {
    throw new DatabaseError(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR, error)
  }
}
