import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import {
  DatabaseError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../../../errors/index.js'
import type { PatchLicenceParams } from '../../../types/index.js'

export async function update({
  id,
  status,
  note,
  updatedBy,
}: PatchLicenceParams) {
  return await db.transaction(async trx => {
    const licence = await trx
      .select()
      .from(licenceTab)
      .where(eq(licenceTab.id, id))
      .limit(1)

    if (licence.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.LICENCE_NOT_FOUND} ID: ${id}`)
    }

    await trx
      .update(licenceTab)
      .set({ status, note })
      .where(eq(licenceTab.id, id))

    const prevChangeLog = Array.isArray(licence[0].changeLog)
      ? licence[0].changeLog
      : []
    const updated = await trx
      .update(licenceTab)
      .set({
        changeLog: [
          ...prevChangeLog,
          {
            updatedBy,
            updatedAt: new Date().toISOString(),
            updatedField: 'status and note',
            previousValue: [String(licence[0].status), String(licence[0].note)],
            newValue: [String(status), String(note)],
          },
        ],
      })
      .where(eq(licenceTab.id, id))
      .returning()

    if (updated.length === 0) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
    }

    return { success: true, message: 'Licence details updated successfully' }
  })
}
