import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { staffTab } from '../drizzle/schema/staffTab'
import { DatabaseError, ERROR_MESSAGES, NotFoundError } from '../errors'
import type { DeleteAssetParams } from '../types'

export async function removeAssetAssignment({
  userConfirmed,
  assetId,
  updatedBy,
}: DeleteAssetParams) {
  // Begin Transaction
  return await db.transaction(async trx => {
    // Get the asset to be removed
    const assetResult = await trx
      .select()
      .from(assetTab)
      .where(eq(assetTab.id, assetId))
      .limit(1)

    if (assetResult.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${assetId}`
      )
    }

    const asset = assetResult[0]
    const prevAssignedTo = asset.assignedTo

    if (!prevAssignedTo) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${prevAssignedTo}`
      )
    }

    const staff = await trx
      .select()
      .from(staffTab)
      .where(eq(staffTab.email, prevAssignedTo))
      .limit(1)

    if (!userConfirmed) {
      throw new DatabaseError(ERROR_MESSAGES.CONFLICTING_CONFIRM)
    }

    // Unassign the asset (clear assignedTo and dateAssigned)
    const assetRemoved = await trx
      .update(assetTab)
      .set({ assignedTo: null, dateAssigned: null })
      .where(eq(assetTab.id, assetId))
      .returning()

    // Update the asset's changeLog (appen new entry)
    const prevChangeLog = Array.isArray(asset.changeLog) ? asset.changeLog : []
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

    // Update Staff changelog
    const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
      ? staff[0].changeLog
      : []
    const newStaffChangeLog = {
      updatedBy,
      updatedAt: new Date().toISOString(),
      updatedField: 'assetHistoryList',
      previousValue: staff[0].assetHistoryList,
      newValue: `Asset with ID:${assetId} removed`,
    }
    const updatedStaffChangeLog = [...prevStaffChangeLog, newStaffChangeLog]
    await trx
      .update(staffTab)
      .set({ changeLog: updatedStaffChangeLog })
      .where(eq(staffTab.email, prevAssignedTo))

    // Return result
    if (assetRemoved.length === 0) {
      throw new DatabaseError(ERROR_MESSAGES.ASSET_REMOVAL_FAILED)
    }
    return {
      success: true,
      message: 'Asset removed successfully',
    }
  })
}
