import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { staffTab } from '../drizzle/schema/staffTab'
import { ConflictError, ERROR_MESSAGES, NotFoundError } from '../errors'
import type { AssignAssetWithConfirmationParams } from '../types'

export async function assignAssetToStaffWithConfirmation({
  userConfirmed,
  staffEmail,
  assetId,
  updatedBy,
}: AssignAssetWithConfirmationParams) {
  // Begin database Transaction
  return await db.transaction(async trx => {
    // Check if the new email belongs to a staff
    const staff = await trx
      .select()
      .from(staffTab)
      .where(eq(staffTab.email, staffEmail))
      .limit(1)
    if (staff.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${staffEmail}`
      )
    }

    // Find the current asset assignment
    const asset = await trx
      .select()
      .from(assetTab)
      .where(eq(assetTab.id, assetId))
      .limit(1)
    if (asset.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${assetId}`
      )
    }
    const previousAssignedTo = asset[0].assignedTo

    // If the asset is already assigned to the same staff, throw conflict error
    if (previousAssignedTo && previousAssignedTo === staffEmail) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_ASSET_ASSIGNMENT} ${staffEmail}.`
      )
    }

    // If the asset was previously assigned and user has not confirmed, return question if wants to reassign asset
    if (
      previousAssignedTo &&
      previousAssignedTo !== staffEmail &&
      !userConfirmed
    ) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_ASSET_ASSIGNMENT} ${previousAssignedTo}. ${ERROR_MESSAGES.CONFLICTING_CONFIRM}`
      )
    }

    // Assign asset to new staff (update asset record))
    await trx
      .update(assetTab)
      .set({ assignedTo: staffEmail, dateAssigned: new Date().toISOString() })
      .where(eq(assetTab.id, assetId))

    // Update staff assetHistoryList to include the new asset ID
    const currentAssetHistory: string[] = Array.isArray(
      staff[0].assetHistoryList
    )
      ? staff[0].assetHistoryList
      : staff[0].assetHistoryList
        ? [staff[0].assetHistoryList]
        : []

    const updatedAssetHistory = currentAssetHistory.includes(assetId)
      ? currentAssetHistory
      : [...currentAssetHistory, assetId]

    if (!updatedAssetHistory.includes(assetId)) {
      updatedAssetHistory.push(assetId)
    }

    await trx
      .update(staffTab)
      .set({ assetHistoryList: updatedAssetHistory })
      .where(eq(staffTab.email, staffEmail))

    // Update Staff changelog
    const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
      ? staff[0].changeLog
      : []
    const newStaffChangeLog = {
      updatedBy,
      updatedAt: new Date().toISOString(),
      updatedField: 'assetHistoryList',
      previousValue: currentAssetHistory,
      newValue: updatedAssetHistory,
    }
    const updatedStaffChangeLog = [...prevStaffChangeLog, newStaffChangeLog]
    await trx
      .update(staffTab)
      .set({ changeLog: updatedStaffChangeLog })
      .where(eq(staffTab.email, staffEmail))

    // Update Asset changeLog
    const prevAssetChangeLog = Array.isArray(asset[0].changeLog)
      ? asset[0].changeLog
      : []
    const newChangeLog = {
      updatedBy,
      updatedAt: new Date().toISOString(),
      updatedField: 'assignedTo',
      previousValue: [String(asset[0].assignedTo)],
      newValue: [String(staffEmail)],
    }
    const updatedChangeLog = [...prevAssetChangeLog, newChangeLog]
    await trx
      .update(assetTab)
      .set({ changeLog: updatedChangeLog })
      .where(eq(assetTab.id, assetId))

    return {
      success: true,
      message: 'Asset assigned successfully',
    }
  })
}
