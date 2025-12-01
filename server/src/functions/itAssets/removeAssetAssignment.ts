import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError, NotFoundError } from '../../errors/errorTypes'
import type { DeleteAssetParams } from '../../types'

export async function removeAssetAssignment({
  userConfirmed,
  assetId,
  updatedBy,
}: DeleteAssetParams) {
  // Begin Transaction
  try {
    return await db.transaction(async trx => {
      // Get the asset to be removed
      const assetResult = await trx
        .select()
        .from(assetTab)
        .where(eq(assetTab.id, assetId))
        .limit(1)
      if (assetResult.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.ASSET_NOT_FOUND)
      }

      const asset = assetResult[0]
      const prevAssignedTo = asset.assignedTo

      if (!userConfirmed) {
        return {
          success: false,
          message: 'Are you sure you want to remove this asset assignment?',
        }
      }

      // Unassign the asset (clear assignedTo and dateAssigned)
      const assetRemoved = await trx
        .update(assetTab)
        .set({ assignedTo: null, dateAssigned: null })
        .where(eq(assetTab.id, assetId))
        .returning()

      // Update the asset's changeLog (appen new entry)
      const prevChangeLog = Array.isArray(asset.changeLog)
        ? asset.changeLog
        : []
      const newChangeLog = {
        updatedBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'assignedTo',
        previousValue: prevAssignedTo,
        newValue:
          'EMPTY - Asset removed from previous user and date assigned cleared',
      }
      const updatedChangeLog = [...prevChangeLog, newChangeLog]
      await trx
        .update(assetTab)
        .set({
          changeLog: updatedChangeLog,
        })
        .where(eq(assetTab.id, assetId))

      //Update Staff changelog?

      // Return result
      if (assetRemoved.length === 0) {
        throw new DatabaseError(ERROR_MESSAGES.ASSET_REMOVAL_FAILED)
      }
      return {
        success: true,
        message: 'Asset removed successfully',
      }
    })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error
    }
    console.error('Error removing asset assignment:', error)
    throw new DatabaseError(ERROR_MESSAGES.ASSET_REMOVAL_FAILED, error)
  }
}
