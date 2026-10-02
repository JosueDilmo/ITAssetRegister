import { sql } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetStaffByEmailParams } from '../../../types/index.js'

// Resolves a signed-in user's staff record (id, name, email) from their email.
// The match is case-insensitive because the session email and the stored staff
// email can differ in case.
export async function getByEmail({ email }: GetStaffByEmailParams) {
  const rows = await db
    .select({
      id: staffTab.id,
      name: staffTab.name,
      email: staffTab.email,
    })
    .from(staffTab)
    .where(sql`lower(${staffTab.email}) = lower(${email})`)
    .limit(1)

  if (rows.length === 0) {
    throw new NotFoundError(`${ERROR_MESSAGES.STAFF_NOT_FOUND} Email: ${email}`)
  }

  return { staff: rows[0] }
}
