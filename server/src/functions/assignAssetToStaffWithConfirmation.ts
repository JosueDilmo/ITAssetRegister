import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { staffTab } from '../drizzle/schema/staffTab'
import {
  ConflictError,
  DatabaseError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../errors'
import type { AssignAssetWithConfirmationParams } from '../types'
import { updateChangelog } from './utils/updateChangelog'

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

    // If the asset is already assigned to the same staff, throw conflict error
    const previousAssignedTo = asset[0].assignedTo
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

    // Wait for changelog updates to complete
    const [staffChangelogResult, assetChangelogResult] = await Promise.all([
      updateChangelog({
        trx: trx,
        tableIdentity: 'staff',
        identifierField: staffTab.email,
        identifierValue: staffEmail,
        newChangeLogEntry: {
          updatedBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assetHistoryList',
          previousValue: currentAssetHistory,
          newValue: updatedAssetHistory,
        },
      }),
      updateChangelog({
        trx: trx,
        tableIdentity: 'asset',
        identifierField: assetTab.id,
        identifierValue: assetId,
        newChangeLogEntry: {
          updatedBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assignedTo',
          previousValue: [String(previousAssignedTo)],
          newValue: [String(staffEmail)],
        },
      }),
    ])

    // Check if both changelog updates succeeded
    if (!staffChangelogResult || !assetChangelogResult) {
      throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
    }

    return {
      success: true,
      message: 'Asset assigned successfully',
    }
  })
}
