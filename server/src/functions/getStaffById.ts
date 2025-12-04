import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { staffTab } from '../drizzle/schema/staffTab'
import { ERROR_MESSAGES, NotFoundError } from '../errors'
import type { GetByIdParams } from '../types'

export async function getStaffById({ id }: GetByIdParams) {
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
    throw new NotFoundError(ERROR_MESSAGES.STAFF_ID_NOT_FOUND)
  }

  const staff = staffQuery.map(staff => ({
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
      previousValue: string
      newValue: string
    }>,
  }))

  return { staff }
}
