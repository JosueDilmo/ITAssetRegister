import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
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

  const staff = staffQuery.map(s => ({
    ...s,
    assetHistoryList: s.assetHistoryList as string[],
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
