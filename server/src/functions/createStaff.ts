import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { staffTab } from '../drizzle/schema/staffTab'
import { ConflictError, DatabaseError, ERROR_MESSAGES } from '../errors'
import type { CreateStaffParams } from '../types'

export async function createStaff({
  name,
  email,
  department,
  jobTitle,
  createdBy,
}: CreateStaffParams) {
  const alreadyRegistered = await db
    .select()
    .from(staffTab)
    .where(eq(staffTab.email, email))

  if (alreadyRegistered.length > 0) {
    throw new ConflictError(
      `${ERROR_MESSAGES.STAFF_ALREADY_EXISTS} Email: ${email}`
    )
  }

  const newRegistered = await db
    .insert(staffTab)
    .values({ name, email, department, jobTitle, createdBy })
    .returning()

  if (newRegistered.length === 0) {
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
  }

  return {
    success: true,
    message: 'Staff registered successfully',
    staff: newRegistered[0].email,
  }
}
