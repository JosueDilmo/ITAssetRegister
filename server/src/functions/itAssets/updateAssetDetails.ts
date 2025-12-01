import { eq, not } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError, NotFoundError } from '../../errors/errorTypes'
import type { PatchDetailsParams } from '../../types'

export async function updateAssetDetails({
  id,
  status,
  note,
  updatedBy,
}: PatchDetailsParams) {
  // Begin database Transaction
  try {
    return await db.transaction(async trx => {
      const asset = await trx
        .select()
        .from(assetTab)
        .where(eq(assetTab.id, id))
        .limit(1)

      if (asset.length === 0) {
        throw new NotFoundError(ERROR_MESSAGES.ASSET_NOT_FOUND)
      }

      // Update the staff's status and note in the database
      await db
        .update(assetTab)
        .set({ status: status, note: note })
        .where(eq(assetTab.id, id))

      // Log the change in the changeLog
      const changeLog = Array.isArray(asset[0].changeLog)
        ? asset[0].changeLog
        : []
      const newChangeLog = {
        updatedBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'status and note',
        previousValue: JSON.stringify({
          status: asset[0].status,
          note: asset[0].note,
        }),
        newValue: JSON.stringify({ status, note }),
      }
      const updatedChangeLog = [...changeLog, newChangeLog]
      await db
        .update(assetTab)
        .set({
          changeLog: updatedChangeLog,
        })
        .where(eq(assetTab.id, id))

      return {
        success: true,
        message: 'Asset details updated successfully',
      }
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }

    console.error('Error in updating asset details', error)
    throw new DatabaseError(ERROR_MESSAGES.ASSET_UPDATE_FAILED, error)
  }
}
