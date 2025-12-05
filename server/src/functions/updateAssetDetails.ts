import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { ERROR_MESSAGES, NotFoundError } from '../errors'
import type { PatchDetailsParams } from '../types'

export async function updateAssetDetails({
  id,
  status,
  note,
  updatedBy,
}: PatchDetailsParams) {
  // Begin database Transaction
  return await db.transaction(async trx => {
    const asset = await trx
      .select()
      .from(assetTab)
      .where(eq(assetTab.id, id))
      .limit(1)

    if (asset.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${id}`)
    }

    // Update the staff's status and note in the database
    await trx
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
      previousValue: [String(asset[0].status), String(asset[0].note)],
      newValue: [String(status), String(note)],
    }
    const updatedChangeLog = [...changeLog, newChangeLog]
    await trx
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
}
