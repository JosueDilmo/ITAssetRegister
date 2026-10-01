import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import {
  ConflictError,
  DatabaseError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../../../errors/index.js'
import type { AssignLicenceParams } from '../../../types/index.js'

export async function assignLicence({
  userConfirmed,
  staffEmail,
  licenceId,
  updatedBy,
}: AssignLicenceParams) {
  return await db.transaction(async trx => {
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

    const licence = await trx
      .select()
      .from(licenceTab)
      .where(eq(licenceTab.id, licenceId))
      .limit(1)
    if (licence.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.LICENCE_NOT_FOUND} ID: ${licenceId}`
      )
    }

    const previousAssignedTo = licence[0].assignedTo
    if (previousAssignedTo && previousAssignedTo === staffEmail) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_LICENCE_ASSIGNMENT} ${staffEmail}.`
      )
    }

    if (
      previousAssignedTo &&
      previousAssignedTo !== staffEmail &&
      !userConfirmed
    ) {
      throw new ConflictError(
        `${ERROR_MESSAGES.CONFLICTING_LICENCE_ASSIGNMENT} ${previousAssignedTo}. ${ERROR_MESSAGES.CONFLICTING_CONFIRM}`
      )
    }

    // Reassignment: the previous owner must get an audit entry too (LIC-04).
    let previousOwner: typeof staffTab.$inferSelect | undefined
    if (previousAssignedTo && previousAssignedTo !== staffEmail) {
      const previousOwnerResult = await trx
        .select()
        .from(staffTab)
        .where(eq(staffTab.email, previousAssignedTo))
        .limit(1)
      if (previousOwnerResult.length === 0) {
        throw new NotFoundError(
          `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${previousAssignedTo}`
        )
      }
      previousOwner = previousOwnerResult[0]
    }

    await trx
      .update(licenceTab)
      .set({
        assignedTo: staffEmail,
        status: 'ACTIVE',
        note: `Licence assigned to staff ${staff[0].name}`,
        dateAssigned: new Date().toISOString(),
      })
      .where(eq(licenceTab.id, licenceId))

    const currentLicenceHistory: string[] = Array.isArray(
      staff[0].licenceHistoryList
    )
      ? (staff[0].licenceHistoryList as string[])
      : staff[0].licenceHistoryList
        ? [staff[0].licenceHistoryList as string]
        : []

    const updatedLicenceHistory = currentLicenceHistory.includes(licenceId)
      ? currentLicenceHistory
      : [...currentLicenceHistory, licenceId]

    await trx
      .update(staffTab)
      .set({ licenceHistoryList: updatedLicenceHistory })
      .where(eq(staffTab.email, staffEmail))

    const prevStaffChangeLog = Array.isArray(staff[0].changeLog)
      ? staff[0].changeLog
      : []
    await trx
      .update(staffTab)
      .set({
        changeLog: [
          ...prevStaffChangeLog,
          {
            updatedBy,
            updatedAt: new Date().toISOString(),
            updatedField: 'licenceHistoryList',
            previousValue: currentLicenceHistory,
            newValue: updatedLicenceHistory,
          },
        ],
      })
      .where(eq(staffTab.email, staffEmail))

    if (previousOwner && previousAssignedTo) {
      const prevOwnerChangeLog = Array.isArray(previousOwner.changeLog)
        ? previousOwner.changeLog
        : []
      await trx
        .update(staffTab)
        .set({
          changeLog: [
            ...prevOwnerChangeLog,
            {
              updatedBy,
              updatedAt: new Date().toISOString(),
              updatedField: 'licenceHistoryList',
              previousValue: [String(previousOwner.licenceHistoryList)],
              newValue: [`Licence reassigned: ${licenceId} to ${staffEmail}`],
            },
          ],
        })
        .where(eq(staffTab.email, previousAssignedTo))
    }

    const prevLicenceChangeLog = Array.isArray(licence[0].changeLog)
      ? licence[0].changeLog
      : []
    const licenceUpdated = await trx
      .update(licenceTab)
      .set({
        changeLog: [
          ...prevLicenceChangeLog,
          {
            updatedBy,
            updatedAt: new Date().toISOString(),
            updatedField: 'assignedTo',
            previousValue: [String(previousAssignedTo)],
            newValue: [String(staffEmail)],
          },
        ],
      })
      .where(eq(licenceTab.id, licenceId))
      .returning()

    if (licenceUpdated.length === 0) {
      throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
    }

    return { success: true, message: 'Licence assigned successfully' }
  })
}
