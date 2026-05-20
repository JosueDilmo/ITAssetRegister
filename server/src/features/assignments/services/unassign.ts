import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ConflictError, DatabaseError, ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { DeleteAssetParams } from '../../../types/index.js'

export async function unassign({ userConfirmed, assetId, updatedBy }: DeleteAssetParams) {
  return await db.transaction(async trx => {
    if (!userConfirmed) {
      throw new ConflictError(ERROR_MESSAGES.CONFLICTING_CONFIRM)
    }

    const assetResult = await trx.select().from(assetTab).where(eq(assetTab.id, assetId)).limit(1)

    if (assetResult.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${assetId}`)
    }

    const asset = assetResult[0]
    const prevAssignedTo = asset.assignedTo

    if (!prevAssignedTo) {
      throw new NotFoundError(`${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${prevAssignedTo}`)
    }

    const staff = await trx.select().from(staffTab).where(eq(staffTab.email, prevAssignedTo)).limit(1)

    if (staff.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${prevAssignedTo}`)
    }

    const assetRemoved = await trx
      .update(assetTab)
      .set({ assignedTo: null, condition: 'IN STOCK', status: 'INACTIVE', dateAssigned: null })
      .where(eq(assetTab.id, assetId))
      .returning()

    const prevAssetChangeLog = Array.isArray(asset.changeLog) ? asset.changeLog : []
    await trx.update(assetTab).set({
      changeLog: [
        ...prevAssetChangeLog,
        {
          updatedBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assignedTo and dateAssigned',
          previousValue: [String(prevAssignedTo), String(asset.dateAssigned)],
          newValue: ['assignedTo: null', 'dateAssigned: null'],
        },
      ],
    }).where(eq(assetTab.id, assetId))

    const prevStaffChangeLog = Array.isArray(staff[0].changeLog) ? staff[0].changeLog : []
    await trx.update(staffTab).set({
      changeLog: [
        ...prevStaffChangeLog,
        {
          updatedBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assignedTo and dateAssigned',
          previousValue: [String(staff[0].assetHistoryList)],
          newValue: [`Asset removed: ${assetId}`],
        },
      ],
    }).where(eq(staffTab.email, prevAssignedTo))

    if (assetRemoved.length === 0) {
      throw new DatabaseError(ERROR_MESSAGES.ASSET_REMOVAL_FAILED)
    }

    return { success: true, message: 'Asset removed successfully' }
  })
}
