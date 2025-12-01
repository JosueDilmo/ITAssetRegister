import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/client'
import { staffTab } from '../../drizzle/schema/staffTab'
import { ERROR_MESSAGES } from '../../errors/errorMessages'
import { DatabaseError } from '../../errors/errorTypes'
import type { CreateStaffParams } from '../../types'

export async function createStaff({
  name,
  email,
  department,
  jobTitle,
  createdBy,
}: CreateStaffParams) {
  try {
    const alreadyRegistered = await db
      .select()
      .from(staffTab)
      .where(eq(staffTab.email, email))

    if (alreadyRegistered.length > 0) {
      return {
        success: true,
        message: 'Staff is already register',
        staff: alreadyRegistered[0].email,
      }
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
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    console.error('Error creating staff:', error)
    throw new DatabaseError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
