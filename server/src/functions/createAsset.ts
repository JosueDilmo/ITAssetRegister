import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { assetTab } from '../drizzle/schema/assetTab'
import { staffTab } from '../drizzle/schema/staffTab'
import { ConflictError, ERROR_MESSAGES, NotFoundError } from '../errors'
import type { CreateAssetParams } from '../types'

export async function createAsset({
  serialNumber,
  name,
  type,
  maker,
  assignedTo,
  datePurchased,
  assetNumber,
  createdBy,
}: CreateAssetParams) {
  // Check if asset already registered
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
  ///

  // Check if staff exists when assignedTo is provided
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
  ///

  // Create new asset
  const result = await db.transaction(async tx => {
    const newAsset = await tx
      .insert(assetTab)
      .values({
        serialNumber,
        name,
        type,
        maker,
        assignedTo,
        dateAssigned: assignedTo ? new Date().toISOString() : null,
        datePurchased,
        assetNumber,
        createdBy,
      })
      .returning()

    // Update staff history and changelod
    if (assignedTo) {
      const staff = await tx
        .select()
        .from(staffTab)
        .where(eq(staffTab.email, assignedTo!))
        .limit(1)

      // Update staff assetHistoryList (append assetID if not already present)
      const currentAssetHistory: string[] = Array.isArray(
        staff[0].assetHistoryList
      )
        ? staff[0].assetHistoryList
        : staff[0].assetHistoryList
          ? [staff[0].assetHistoryList]
          : []

      const updatedAssetHistory = currentAssetHistory.includes(newAsset[0].id)
        ? currentAssetHistory
        : [...currentAssetHistory, newAsset[0].id]

      if (!updatedAssetHistory.includes(newAsset[0].id)) {
        updatedAssetHistory.push(newAsset[0].id)
      }
      await tx
        .update(staffTab)
        .set({ assetHistoryList: updatedAssetHistory })
        .where(eq(staffTab.email, assignedTo!))

      // Update Staff changeLog
      const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
        ? staff[0].changeLog
        : []
      const newStaffChangeLog = {
        updatedBy: createdBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'assetHistoryList',
        previousValue: currentAssetHistory,
        newValue: updatedAssetHistory,
      }
      const updatedStaffChangeLog = [...prevStaffChangeLog, newStaffChangeLog]

      await tx
        .update(staffTab)
        .set({
          changeLog: updatedStaffChangeLog,
        })
        .where(eq(staffTab.id, staff[0].id))

      // Update Asset changeLog
      const prevAssetChangeLog = Array.isArray(newAsset[0].changeLog)
        ? newAsset[0].changeLog
        : []
      const newAssetChangeLog = {
        updatedBy: createdBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'assignedTo',
        previousValue: [String(newAsset[0].assignedTo)],
        newValue: [String(assignedTo)],
      }
      const updatedAssetChangeLog = [...prevAssetChangeLog, newAssetChangeLog]
      await tx
        .update(assetTab)
        .set({ changeLog: updatedAssetChangeLog })
        .where(eq(assetTab.id, newAsset[0].id))

      // Return success message with assigned staff if applicable
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
