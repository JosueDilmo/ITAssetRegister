import { asc, ilike } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { staffTab } from '../drizzle/schema/staffTab'
import { DatabaseError, ERROR_MESSAGES } from '../errors'
import type { GetAllStaffParams } from '../types'

export async function getStaff({ orderBy, page, search }: GetAllStaffParams) {
  const [query, total] = await Promise.all([
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
        changeLog: staffTab.changeLog,
      })
      .from(staffTab)
      .where(search ? ilike(staffTab.name, `%${search}%`) : undefined)
      .limit(20)
      .offset((page - 1) * 20)
      .orderBy(asc(staffTab[orderBy])),

    db.$count(
      staffTab,
      search ? ilike(staffTab.name, `%${search}%`) : undefined
    ),
  ])
  if (query.length === 0) {
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
  }

  if (!total) {
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
  }

  const staffList = query.map(staff => ({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    department: staff.department,
    jobTitle: staff.jobTitle,
    status: staff.status,
    note: staff.note,
    assetHistoryList: staff.assetHistoryList as string[],
    createdAt: staff.createdAt,
    createdBy: staff.createdBy,
    changeLog: staff.changeLog as Array<{
      updatedBy: string
      updatedAt: string
      updatedField: string
      previousValue: string[]
      newValue: string[]
    }>,
  }))

  const totalPages = Math.ceil(total / 20)

  return { staffList, totalPages }
}
