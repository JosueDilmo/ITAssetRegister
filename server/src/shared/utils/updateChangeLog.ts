import type { Column } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import type { db } from '../../drizzle/client.js'
import { assetTab } from '../../drizzle/schema/assetTab.js'
import { staffTab } from '../../drizzle/schema/staffTab.js'
import { DatabaseError, ERROR_MESSAGES } from '../../errors/index.js'
import type { ChangeLogEntry } from '../../types/index.js'

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
  const record = await trx
    .select()
    .from(tableIdentity === 'staff' ? staffTab : assetTab)
    .where(eq(identifierField, identifierValue))
    .limit(1)

  if (record.length === 0) {
    throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
  }
  const currentChangeLog = Array.isArray(record[0].changeLog)
    ? record[0].changeLog
    : []
  const updatedChangeLog = [...currentChangeLog, newChangeLogEntry]

  await trx
    .update(tableIdentity === 'staff' ? staffTab : assetTab)
    .set({ changeLog: updatedChangeLog })
    .where(eq(identifierField, identifierValue))

  return true
}
