import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import {
  ConflictError,
  DatabaseError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../../../errors/index.js'
import type { AssignAssetWithConfirmationParams } from '../../../types/index.js'
import { updateChangelog } from '../../../shared/utils/updateChangeLog.js'

export async function assign({
  userConfirmed,
  staffEmail,
  assetId,
  updatedBy,
}: AssignAssetWithConfirmationParams) {
  return await db.transaction(async trx => {
    const staff = await trx
      .select()
      .from(staffTab)
      .where(eq(staffTab.email, staffEmail))
      .limit(1)
    if (staff.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${staffEmail}`)
    }

    const asset = await trx
      .select()
      .from(assetTab)
      .where(eq(assetTab.id, assetId))
      .limit(1)
    if (asset.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${assetId}`)
    }

    const previousAssignedTo = asset[0].assignedTo
    if (previousAssignedTo && previousAssignedTo === staffEmail) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_ASSET_ASSIGNMENT} ${staffEmail}.`
      )
    }

    if (previousAssignedTo && previousAssignedTo !== staffEmail && !userConfirmed) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_ASSET_ASSIGNMENT} ${previousAssignedTo}. ${ERROR_MESSAGES.CONFLICTING_CONFIRM}`
      )
    }

    await trx.update(assetTab).set({
      assignedTo: staffEmail,
      condition: 'IN USE',
      status: 'ACTIVE',
      note: `Asset assigned to staff ${staff[0].name}`,
      dateAssigned: new Date().toISOString(),
    }).where(eq(assetTab.id, assetId))

    const currentAssetHistory: string[] = Array.isArray(staff[0].assetHistoryList)
      ? staff[0].assetHistoryList
      : staff[0].assetHistoryList
        ? [staff[0].assetHistoryList]
        : []

    const updatedAssetHistory = currentAssetHistory.includes(assetId)
      ? currentAssetHistory
      : [...currentAssetHistory, assetId]

    await trx.update(staffTab).set({ assetHistoryList: updatedAssetHistory }).where(eq(staffTab.email, staffEmail))

    const [staffChangelogResult, assetChangelogResult] = await Promise.all([
      updateChangelog({
        trx,
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
        trx,
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

    if (!staffChangelogResult || !assetChangelogResult) {
      throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
    }

    return { success: true, message: 'Asset assigned successfully' }
  })
}
