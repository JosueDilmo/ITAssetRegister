import { asc, count, ilike } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import type { GetAllAssetsParams } from '../../../types/index.js'

export async function getAll({
  search,
  page = 1,
  limit = 25,
}: GetAllAssetsParams) {
  const whereClause = search
    ? ilike(licenceTab.licenceNumber, `%${search}%`)
    : undefined

  const [countResult, query] = await Promise.all([
    db.select({ total: count() }).from(licenceTab).where(whereClause),
    db
      .select({
        id: licenceTab.id,
        name: licenceTab.name,
        vendor: licenceTab.vendor,
        licenceType: licenceTab.licenceType,
        serialNumber: licenceTab.serialNumber,
        licenceNumber: licenceTab.licenceNumber,
        datePurchased: licenceTab.datePurchased,
        expiryDate: licenceTab.expiryDate,
        seatsTotal: licenceTab.seatsTotal,
        cost: licenceTab.cost,
        assignedTo: licenceTab.assignedTo,
        dateAssigned: licenceTab.dateAssigned,
        status: licenceTab.status,
        note: licenceTab.note,
        createdAt: licenceTab.createdAt,
        createdBy: licenceTab.createdBy,
      })
      .from(licenceTab)
      .where(whereClause)
      .orderBy(asc(licenceTab.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ])

  const total = countResult[0]?.total ?? 0
  const licenceList = query.map(licence => ({ ...licence }))

  return { licenceList, total }
}
