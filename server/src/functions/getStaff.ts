import { asc, ilike } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { staffTab } from '../drizzle/schema/staffTab'
import type { GetAllStaffParams } from '../types'

export async function getStaff({ search }: GetAllStaffParams) {
  const query = await db
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
    .orderBy(asc(staffTab.createdAt))

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
      updatedBy: string,
      updatedAt: string,
      updatedField: string,
      previousValue: string[],
      newValue: string[],
    }>,
  }));

  return { staffList };
}
