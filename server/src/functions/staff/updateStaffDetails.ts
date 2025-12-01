import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { staffTab } from '../../drizzle/schema/staffTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError, NotFoundError } from '../../errors/errorTypes'
import type { PatchDetailsParams } from '../../types'

export async function updateStaffDetails({
  id,
  status,
  note,
  updatedBy,
}: PatchDetailsParams) {
  try {
    const staff = await db
      .select()
      .from(staffTab)
      .where(eq(staffTab.id, id))
      .limit(1)

    if (staff.length === 0) {
      throw new NotFoundError(ERROR_MESSAGES.STAFF_NOT_FOUND)
    }

    // Update the staff's status and note in the database
    return await db.transaction(async tx => {
      await tx
        .update(staffTab)
        .set({ status: status, note: note })
        .where(eq(staffTab.id, id))

      // Log the change in the changeLog
      const changeLog = Array.isArray(staff[0].changeLog)
        ? staff[0].changeLog
        : []
      const newChangeLog = {
        updatedBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'status and note',
        previousValue: JSON.stringify({
          status: staff[0].status,
          note: staff[0].note,
        }),
        newValue: JSON.stringify({ status, note }),
      }
      const updatedChangeLog = [...changeLog, newChangeLog]
      await db
        .update(staffTab)
        .set({
          changeLog: updatedChangeLog,
        })
        .where(eq(staffTab.id, id))

      return {
        success: true,
        message: 'Staff details updated successfully',
      }
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }

    // Handle other errors
    console.error('Error updating staff details:', error)
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
  }
}
