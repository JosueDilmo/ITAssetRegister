import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { staffTab } from '../../drizzle/schema/staffTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError, NotFoundError } from '../../errors/errorTypes'
import type { CreateAssetParams } from '../../types'

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
  try {
    // Check if staff exists when assignedTo is provided
    if (assignedTo) {
      const checkAssignedTo = await db
        .select()
        .from(staffTab)
        .where(eq(staffTab.email, assignedTo))
        .limit(1)

      if (checkAssignedTo.length === 0) {
        throw new NotFoundError(`Staff with email ${assignedTo} not found`)
      }
    }

    // Check if asset already registered
    const alreadyRegistered = await db
      .select()
      .from(assetTab)
      .where(eq(assetTab.serialNumber, serialNumber))
      .limit(1)

    if (alreadyRegistered.length > 0) {
      return {
        success: true,
        message: 'Asset already registered',
        staff: alreadyRegistered[0].assignedTo,
      }
    }

    // Create new asset
    await db.transaction(async tx => {
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

      // Check if asset creation was successful
      if (newAsset.length === 0) {
        throw new DatabaseError(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR)
      }

      // Update staff history and changelod
      if (assignedTo) {
        const staff = await db.transaction(async trx => {
          return await trx
            .select()
            .from(staffTab)
            .where(eq(staffTab.email, assignedTo!))
            .limit(1)
        })

        // Update staff assetHistoryList (append assetID if not already present)
        const currentAssetHistory: string[] = Array.isArray(
          staff[0].assetHistoryList
        )
          ? staff[0].assetHistoryList
          : []
        const updatedAssetHistory = currentAssetHistory.includes(newAsset[0].id)
          ? currentAssetHistory
          : [...currentAssetHistory, newAsset[0].id]
        await tx
          .update(staffTab)
          .set({ assetHistoryList: updatedAssetHistory })
          .where(eq(staffTab.email, assignedTo!))

        // Update Staff changeLog
        const staffChangeLog = Array.isArray(staff[0].changeLog)
          ? staff[0].changeLog
          : []
        const newStaffChangeLog = {
          updatedBy: createdBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assetHistoryList',
          previousValue: JSON.stringify({
            assetHistoryList: staff[0].assetHistoryList,
          }),
          newValue: JSON.stringify({ assetHistoryList: updatedAssetHistory }),
        }
        const updatedStaffChangeLog = [...staffChangeLog, newStaffChangeLog]
        await db
          .update(staffTab)
          .set({
            changeLog: updatedStaffChangeLog,
          })
          .where(eq(staffTab.id, staff[0].id))

        // Update Asset changeLog
        const prevChangeLog = Array.isArray(newAsset[0].changeLog)
          ? newAsset[0].changeLog
          : []
        const newChangeLog = {
          updatedBy: createdBy,
          updatedAt: new Date().toISOString(),
          updatedField: 'assignedTo',
          previousValue: newAsset[0].assignedTo,
          newValue: assignedTo,
        }
        const updatedChangeLog = [...prevChangeLog, newChangeLog]
        await tx
          .update(assetTab)
          .set({ changeLog: updatedChangeLog })
          .where(eq(assetTab.id, newAsset[0].id))

        // Return success message with assigned staff if applicable
        return {
          success: true,
          message: 'Asset registered successfully',
          staff: newAsset[0].assignedTo,
        }
      }
    })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error
    }

    // Log unexpected errors
    console.error('Error assigning asset:', error)
    throw new DatabaseError(ERROR_MESSAGES.ASSET_ASSIGNMENT_FAILED, error)
  }
}
