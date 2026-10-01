import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import {
  ConflictError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../../../errors/index.js'
import type { CreateLicenceParams } from '../../../types/index.js'

export async function create({
  name,
  vendor,
  licenceType,
  licenceKey,
  serialNumber,
  licenceNumber,
  datePurchased,
  expiryDate,
  cost,
  assignedTo,
  createdBy,
}: CreateLicenceParams) {
  const alreadyRegistered = await db
    .select()
    .from(licenceTab)
    .where(eq(licenceTab.licenceNumber, licenceNumber))
    .limit(1)

  if (alreadyRegistered.length > 0) {
    throw new ConflictError(
      `${ERROR_MESSAGES.LICENCE_ALREADY_EXISTS} Licence Number: ${licenceNumber}`
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
    const newLicence = await tx
      .insert(licenceTab)
      .values({
        name,
        vendor,
        licenceType,
        licenceKey,
        serialNumber: serialNumber ?? null,
        licenceNumber,
        datePurchased,
        expiryDate,
        cost,
        assignedTo,
        dateAssigned: assignedTo ? new Date().toISOString() : null,
        createdBy,
      })
      .returning()

    if (assignedTo) {
      const staff = await tx
        .select()
        .from(staffTab)
        .where(eq(staffTab.email, assignedTo))
        .limit(1)

      const currentLicenceHistory: string[] = Array.isArray(
        staff[0].licenceHistoryList
      )
        ? staff[0].licenceHistoryList
        : staff[0].licenceHistoryList
          ? [staff[0].licenceHistoryList]
          : []

      const updatedLicenceHistory = currentLicenceHistory.includes(
        newLicence[0].id
      )
        ? currentLicenceHistory
        : [...currentLicenceHistory, newLicence[0].id]

      await tx
        .update(staffTab)
        .set({ licenceHistoryList: updatedLicenceHistory })
        .where(eq(staffTab.email, assignedTo))

      const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
        ? staff[0].changeLog
        : []
      await tx
        .update(staffTab)
        .set({
          changeLog: [
            ...prevStaffChangeLog,
            {
              updatedBy: createdBy,
              updatedAt: new Date().toISOString(),
              updatedField: 'licenceHistoryList',
              previousValue: currentLicenceHistory,
              newValue: updatedLicenceHistory,
            },
          ],
        })
        .where(eq(staffTab.id, staff[0].id))

      const prevLicenceChangeLog = Array.isArray(newLicence[0].changeLog)
        ? newLicence[0].changeLog
        : []
      await tx
        .update(licenceTab)
        .set({
          changeLog: [
            ...prevLicenceChangeLog,
            {
              updatedBy: createdBy,
              updatedAt: new Date().toISOString(),
              updatedField: 'assignedTo',
              previousValue: [String(newLicence[0].assignedTo)],
              newValue: [String(assignedTo)],
            },
          ],
        })
        .where(eq(licenceTab.id, newLicence[0].id))

      return {
        success: true,
        message: 'Licence registered successfully',
        staff: newLicence[0].assignedTo,
        licenceId: newLicence[0].id,
      }
    }

    return {
      success: true,
      message: 'Licence registered successfully',
      staff: null,
      licenceId: newLicence[0].id,
    }
  })

  return result
}
