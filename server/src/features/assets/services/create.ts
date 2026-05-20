import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ConflictError, ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { CreateAssetParams } from '../../../types/index.js'

export async function create({
  serialNumber,
  name,
  type,
  maker,
  condition,
  assignedTo,
  datePurchased,
  assetNumber,
  createdBy,
}: CreateAssetParams) {
  const alreadyRegistered = await db
    .select()
    .from(assetTab)
    .where(eq(assetTab.serialNumber, serialNumber))
    .limit(1)

  if (alreadyRegistered.length > 0) {
    throw new ConflictError(
      `${ERROR_MESSAGES.ASSET_ALREADY_EXISTS} Serial Number: ${serialNumber}`
    )
  }

  if (assignedTo) {
    const checkAssignedTo = await db
      .select()
      .from(staffTab)
      .where(eq(staffTab.email, assignedTo))
      .limit(1)

    if (checkAssignedTo.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${assignedTo}`
      )
    }
  }

  const result = await db.transaction(async tx => {
    const newAsset = await tx
      .insert(assetTab)
      .values({
        serialNumber,
        name,
        type,
        maker,
        condition,
        assignedTo,
        dateAssigned: assignedTo ? new Date().toISOString() : null,
        datePurchased,
        assetNumber,
        createdBy,
      })
      .returning()

    if (assignedTo) {
      const staff = await tx
        .select()
        .from(staffTab)
        .where(eq(staffTab.email, assignedTo!))
        .limit(1)

      const currentAssetHistory: string[] = Array.isArray(staff[0].assetHistoryList)
        ? staff[0].assetHistoryList
        : staff[0].assetHistoryList
          ? [staff[0].assetHistoryList]
          : []

      const updatedAssetHistory = currentAssetHistory.includes(newAsset[0].id)
        ? currentAssetHistory
        : [...currentAssetHistory, newAsset[0].id]

      await tx
        .update(staffTab)
        .set({ assetHistoryList: updatedAssetHistory })
        .where(eq(staffTab.email, assignedTo!))

      const prevStaffChangeLog = Array.isArray(staff[0].changeLog) ? staff[0].changeLog : []
      await tx
        .update(staffTab)
        .set({
          changeLog: [
            ...prevStaffChangeLog,
            {
              updatedBy: createdBy,
              updatedAt: new Date().toISOString(),
              updatedField: 'assetHistoryList',
              previousValue: currentAssetHistory,
              newValue: updatedAssetHistory,
            },
          ],
        })
        .where(eq(staffTab.id, staff[0].id))

      const prevAssetChangeLog = Array.isArray(newAsset[0].changeLog) ? newAsset[0].changeLog : []
      await tx
        .update(assetTab)
        .set({
          changeLog: [
            ...prevAssetChangeLog,
            {
              updatedBy: createdBy,
              updatedAt: new Date().toISOString(),
              updatedField: 'assignedTo',
              previousValue: [String(newAsset[0].assignedTo)],
              newValue: [String(assignedTo)],
            },
          ],
        })
        .where(eq(assetTab.id, newAsset[0].id))

      return {
        success: true,
        message: 'Asset registered successfully',
        staff: newAsset[0].assignedTo,
        assetId: newAsset[0].id,
      }
    }

    return {
      success: true,
      message: 'Asset registered successfully',
      staff: null,
      assetId: newAsset[0].id,
    }
  })

  return result
}
