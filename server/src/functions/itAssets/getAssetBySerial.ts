import { eq, not } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  DatabaseError,
  NotFoundError,
} from '../../errors/errorTypes'
import type { GetAssetSerialParams } from '../../types'

export async function getAssetBySerial({ serialNumber }: GetAssetSerialParams) {
  try {
    const asset = await db
      .select()
      .from(assetTab)
      .where(eq(assetTab.serialNumber, serialNumber))

    if (asset.length === 0) {
      throw new NotFoundError(ERROR_MESSAGES.ASSET_NOT_FOUND)
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
        createdAt: asset.createdAt.toString(),
        createdBy: asset.createdBy,
      }
    })
    return {
      success: true,
      message: 'Asset list retrieved successfully',
      assetList,
    }
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof AuthorizationError ||
      error instanceof ConflictError ||
      error instanceof AuthenticationError
    ) {
      throw error
    }

    // Log unexpected errors
    console.error('Error assigning asset:', error)
    throw new DatabaseError(ERROR_MESSAGES.ASSET_ASSIGNMENT_FAILED, error)
  }
}
