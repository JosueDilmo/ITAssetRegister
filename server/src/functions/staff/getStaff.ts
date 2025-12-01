import { db } from '../../drizzle/client'
import { staffTab } from '../../drizzle/schema/staffTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError } from '../../errors/errorTypes'

export async function getStaff() {
  try {
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

    const staffList = query.map(staff => {
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        jobTitle: staff.jobTitle,
        status: staff.status,
        note: staff.note,
        assetHistoryList: (staff.assetHistoryList as string[]) || [],
        createdAt: staff.createdAt,
        createdBy: staff.createdBy,
        changeLog: staff.changeLog as Array<{
          updatedBy: string
          updatedAt: Date
          updatedField: string
          previousValue: string
          newValue: string
        }>,
      }
    })
    return { staffList }
  } catch (error) {
    console.error('Error fetching staff:', error)
    throw new DatabaseError(ERROR_MESSAGES.DATABASE_CONNECTION_ERROR)
  }
}
