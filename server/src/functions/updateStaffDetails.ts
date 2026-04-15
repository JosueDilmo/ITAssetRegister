import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { staffTab } from '../drizzle/schema/staffTab'
import { DatabaseError, ERROR_MESSAGES, NotFoundError } from '../errors'
import type { PatchDetailsParams } from '../types'
import { updateChangelog } from './utils/updateChangeLog'

export async function updateStaffDetails({
  id,
  status,
  note,
  updatedBy,
}: PatchDetailsParams) {
  // Begin Transaction
  return await db.transaction(async trx => {
    const staff = await trx
      .select()
      .from(staffTab)
      .where(eq(staffTab.id, id))
      .limit(1)
  
    if (staff.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.STAFF_NOT_FOUND} ID: ${id}`)
    }

    await trx
      .update(staffTab)
      .set({ status: status, note: note })
      .where(eq(staffTab.id, id))

    // Log the change in the changeLog
    const changelogUpdateResult = await updateChangelog({
      trx,
      tableIdentity: 'staff',
      identifierField: staffTab.id,
      identifierValue: id,
      newChangeLogEntry: {
      updatedBy,
      updatedAt: new Date().toISOString(),
      updatedField: 'status and note',
      previousValue: [String(staff[0].status), String(staff[0].note)],
      newValue: [String(status), String(note)],
    }
    })

    if (!changelogUpdateResult) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
    }
    
    return {
      success: true,
      message: 'Staff details updated successfully',
    }
  })
}
