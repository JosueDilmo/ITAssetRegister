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
  serialNumber,
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

    // `note` omitted (undefined) means "leave unchanged"; an explicit null
    // clears the note.
    await trx
      .update(licenceTab)
      .set({
        status,
        ...(note !== undefined ? { note } : {}),
        ...(serialNumber !== undefined ? { serialNumber } : {}),
      })
      .where(eq(licenceTab.id, id))

    const updatedAt = new Date().toISOString()
    const newEntries: Array<{
      updatedBy: string
      updatedAt: string
      updatedField: string
      previousValue: string[]
      newValue: string[]
    }> = []

    if (status !== licence[0].status) {
      newEntries.push({
        updatedBy,
        updatedAt,
        updatedField: 'status',
        previousValue: [String(licence[0].status)],
        newValue: [String(status)],
      })
    }
    if (note !== undefined && (note ?? null) !== (licence[0].note ?? null)) {
      newEntries.push({
        updatedBy,
        updatedAt,
        updatedField: 'note',
        previousValue: [String(licence[0].note)],
        newValue: [String(note)],
      })
    }
    if (
      serialNumber !== undefined &&
      (serialNumber ?? null) !== (licence[0].serialNumber ?? null)
    ) {
      newEntries.push({
        updatedBy,
        updatedAt,
        updatedField: 'serialNumber',
        previousValue: [String(licence[0].serialNumber ?? '')],
        newValue: [String(serialNumber ?? '')],
      })
    }

    if (newEntries.length > 0) {
      const prevChangeLog = Array.isArray(licence[0].changeLog)
        ? licence[0].changeLog
        : []
      const updated = await trx
        .update(licenceTab)
        .set({ changeLog: [...prevChangeLog, ...newEntries] })
        .where(eq(licenceTab.id, id))
        .returning()

      if (updated.length === 0) {
        throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
      }
    }

    return { success: true, message: 'Licence details updated successfully' }
  })
}
