import { asc, count, ilike } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import type { GetAllStaffParams } from '../../../types/index.js'

export async function getAll({ search, page = 1, limit = 25 }: GetAllStaffParams) {
  const whereClause = search ? ilike(staffTab.name, `%${search}%`) : undefined

  const [countResult, query] = await Promise.all([
    db.select({ total: count() }).from(staffTab).where(whereClause),
    db
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
      })
      .from(staffTab)
      .where(whereClause)
      .orderBy(asc(staffTab.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
  ])

  const total = countResult[0]?.total ?? 0
  const staffList = query.map(s => ({
    ...s,
    assetHistoryList: s.assetHistoryList as string[],
  }))

  return { staffList, total }
}
