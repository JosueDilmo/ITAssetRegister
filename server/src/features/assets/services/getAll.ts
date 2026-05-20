import { asc, count, ilike } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import type { GetAllAssetsParams } from '../../../types/index.js'

export async function getAll({
  search,
  page = 1,
  limit = 25,
}: GetAllAssetsParams) {
  const whereClause = search
    ? ilike(assetTab.serialNumber, `%${search}%`)
    : undefined

  const [countResult, query] = await Promise.all([
    db.select({ total: count() }).from(assetTab).where(whereClause),
    db
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
      })
      .from(assetTab)
      .where(whereClause)
      .orderBy(asc(assetTab.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ])

  const total = countResult[0]?.total ?? 0
  const assetList = query.map(asset => ({ ...asset }))

  return { assetList, total }
}
