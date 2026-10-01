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
import type { UnassignLicenceParams } from '../../../types/index.js'

export async function unassignLicence({
  userConfirmed,
  licenceId,
  updatedBy,
}: UnassignLicenceParams) {
  if (!userConfirmed) {
    throw new ConflictError(ERROR_MESSAGES.CONFLICTING_CONFIRM)
  }

  return await db.transaction(async trx => {
    const licenceResult = await trx
      .select()
      .from(licenceTab)
      .where(eq(licenceTab.id, licenceId))
      .limit(1)

    if (licenceResult.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.LICENCE_NOT_FOUND} ID: ${licenceId}`
      )
    }

    const licence = licenceResult[0]
    const prevAssignedTo = licence.assignedTo

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

    if (staff.length === 0) {
      throw new NotFoundError(
        `${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${prevAssignedTo}`
      )
    }

    const licenceRemoved = await trx
      .update(licenceTab)
      .set({ assignedTo: null, status: 'INACTIVE', dateAssigned: null })
      .where(eq(licenceTab.id, licenceId))
      .returning()

    const prevLicenceChangeLog = Array.isArray(licence.changeLog)
      ? licence.changeLog
      : []
    await trx
      .update(licenceTab)
      .set({
        changeLog: [
          ...prevLicenceChangeLog,
          {
            updatedBy,
            updatedAt: new Date().toISOString(),
            updatedField: 'assignedTo and dateAssigned',
            previousValue: [
              String(prevAssignedTo),
              String(licence.dateAssigned),
            ],
            newValue: ['assignedTo: null', 'dateAssigned: null'],
          },
        ],
      })
      .where(eq(licenceTab.id, licenceId))
      .returning()

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
            previousValue: [String(staff[0].licenceHistoryList)],
            newValue: [`Licence removed: ${licenceId}`],
          },
        ],
      })
      .where(eq(staffTab.email, prevAssignedTo))
      .returning()

    if (licenceRemoved.length === 0) {
      throw new DatabaseError(ERROR_MESSAGES.LICENCE_REMOVAL_FAILED)
    }

    return { success: true, message: 'Licence removed successfully' }
  })
}
