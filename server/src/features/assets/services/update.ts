import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { DatabaseError, ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { PatchDetailsParams } from '../../../types/index.js'
import { updateChangelog } from '../../../shared/utils/updateChangeLog.js'

export async function update({ id, status, condition, note, updatedBy }: PatchDetailsParams) {
  return await db.transaction(async trx => {
    const asset = await trx.select().from(assetTab).where(eq(assetTab.id, id)).limit(1)

    if (asset.length === 0) {
      throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${id}`)
    }

    await trx.update(assetTab).set({ status, condition, note }).where(eq(assetTab.id, id))

    const changelogUpdateResult = await updateChangelog({
      trx,
      tableIdentity: 'asset',
      identifierField: assetTab.id,
      identifierValue: id,
      newChangeLogEntry: {
        updatedBy,
        updatedAt: new Date().toISOString(),
        updatedField: 'status and note',
        previousValue: [String(asset[0].status), String(asset[0].note)],
        newValue: [String(status), String(note)],
      },
    })

    if (!changelogUpdateResult) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_TRANSACTION_ERROR)
    }

    return { success: true, message: 'Asset details updated successfully' }
  })
}
