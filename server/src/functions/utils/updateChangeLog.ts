import type { Column } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import type { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'
import { staffTab } from '../../drizzle/schema/staffTab'
import { DatabaseError, ERROR_MESSAGES } from '../../errors'
import type { ChangeLogEntry } from '../../types'

/**
 * Updates the changeLog field for a given record in a table.
 * @param trx - The database transaction object
 * @param tableIdentity - The identity of the table ('staff' or 'asset')
 * @param identifierField - The field to identify the record (e.g., table.id, table.email)
 * @param identifierValue - The value to match for the identifier
 * @param newChangeLogEntry - The new changeLog entry to append
 */
export async function updateChangelog({
  trx,
  tableIdentity,
  identifierField,
  identifierValue,
  newChangeLogEntry,
}: {
  trx: Parameters<Parameters<typeof db.transaction>[0]>[0]
  tableIdentity: string
  identifierField: Column
  identifierValue: string | number
  newChangeLogEntry: ChangeLogEntry
}) {
  // Fetch the current record
  const record = await trx
    .select()
    .from(tableIdentity === 'staff' ? staffTab : assetTab)
    .where(eq(identifierField, identifierValue))
    .limit(1)

  if (record.length === 0) {
    throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
  }
  // Prepare the updated changeLog
  const currentChangeLog = Array.isArray(record[0].changeLog)
    ? record[0].changeLog
    : []
  const updatedChangeLog = [...currentChangeLog, newChangeLogEntry]

  // Update the record with the new changeLog
  await trx
    .update(tableIdentity === 'staff' ? staffTab : assetTab)
    .set({ changeLog: updatedChangeLog })
    .where(eq(identifierField, identifierValue))

  return true
}
