import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetByIdParams } from '../../../types/index.js'

export async function getById({ id }: GetByIdParams) {
  const assetQuery = await db
    .select({
      id: assetTab.id,
      serialNumber: assetTab.serialNumber,
      name: assetTab.name,
      type: assetTab.type,
      maker: assetTab.maker,
      condition: assetTab.condition,
      assignedTo: assetTab.assignedTo,
      dateAssigned: assetTab.dateAssigned,
      datePurchased: assetTab.datePurchased,
      assetNumber: assetTab.assetNumber,
      status: assetTab.status,
      note: assetTab.note,
      createdAt: assetTab.createdAt,
      createdBy: assetTab.createdBy,
      changeLog: assetTab.changeLog,
    })
    .from(assetTab)
    .where(eq(assetTab.id, id))

  if (assetQuery.length === 0) {
    throw new NotFoundError(`${ERROR_MESSAGES.ASSET_NOT_FOUND} ID: ${id}`)
  }

  const asset = assetQuery.map(a => ({
    ...a,
    changeLog: a.changeLog as Array<{
      updatedBy: string
      updatedAt: string
      updatedField: string
      previousValue: string[]
      newValue: string[]
    }>,
  }))

  return { asset }
}
