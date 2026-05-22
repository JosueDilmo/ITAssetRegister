import { eq, inArray } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetByIdParams } from '../../../types/index.js'

export async function getById({ id }: GetByIdParams) {
  const staffQuery = await db
    .select({
      id: staffTab.id,
      name: staffTab.name,
      email: staffTab.email,
      department: staffTab.department,
      jobTitle: staffTab.jobTitle,
      status: staffTab.status,
      note: staffTab.note,
      assetHistoryList: staffTab.assetHistoryList,
      createdAt: staffTab.createdAt,
      createdBy: staffTab.createdBy,
      changeLog: staffTab.changeLog,
    })
    .from(staffTab)
    .where(eq(staffTab.id, id))

  if (staffQuery.length === 0) {
    throw new NotFoundError(`${ERROR_MESSAGES.STAFF_ID_NOT_FOUND} ID: ${id}`)
  }

  const rawIds = (staffQuery[0].assetHistoryList as string[]).filter(Boolean)

  let assetMap: Record<string, { id: string; name: string; serialNumber: string; assetNumber: string }> = {}
  if (rawIds.length > 0) {
    const assets = await db
      .select({ id: assetTab.id, name: assetTab.name, serialNumber: assetTab.serialNumber, assetNumber: assetTab.assetNumber })
      .from(assetTab)
      .where(inArray(assetTab.id, rawIds))
    assetMap = Object.fromEntries(assets.map(a => [a.id, a]))
  }

  const staff = staffQuery.map(s => ({
    ...s,
    assetHistoryList: (s.assetHistoryList as string[]).filter(Boolean).map(assetId => assetMap[assetId] ?? { id: assetId, name: '—', serialNumber: '—', assetNumber: '—' }),
    changeLog: s.changeLog as Array<{
      updatedBy: string
      updatedAt: string
      updatedField: string
      previousValue: string[]
      newValue: string[]
    }>,
  }))

  return { staff }
}
