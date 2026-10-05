import { eq, sql } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { assetTab } from '../../../drizzle/schema/assetTab.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'

// Returns the signed-in user's own staff profile, assigned assets and assigned
// licences. Identity is the session email only. Every select names its columns
// explicitly so notes, change logs, history lists, createdBy and the licence
// key can never leak through this read.
export async function getMe({ email }: { email: string }) {
  const rows = await db
    .select({
      name: staffTab.name,
      email: staffTab.email,
      department: staffTab.department,
      jobTitle: staffTab.jobTitle,
      status: staffTab.status,
    })
    .from(staffTab)
    .where(sql`lower(${staffTab.email}) = lower(${email})`)
    .limit(1)

  const staff = rows[0] ?? null

  // A signed-in user without a staff record is a valid state, not an error.
  if (!staff) {
    return { staff: null, assets: [], licences: [] }
  }

  // assignedTo holds the stored staff email, so filter on that value and not on
  // the raw session email, which can differ in case.
  const assetRows = await db
    .select({
      id: assetTab.id,
      assetNumber: assetTab.assetNumber,
      type: assetTab.type,
      maker: assetTab.maker,
      name: assetTab.name,
      serialNumber: assetTab.serialNumber,
    })
    .from(assetTab)
    .where(eq(assetTab.assignedTo, staff.email))

  const licenceRows = await db
    .select({
      id: licenceTab.id,
      licenceNumber: licenceTab.licenceNumber,
      name: licenceTab.name,
      licenceType: licenceTab.licenceType,
      expiryDate: licenceTab.expiryDate,
    })
    .from(licenceTab)
    .where(eq(licenceTab.assignedTo, staff.email))

  const assets = [...assetRows].sort((a, b) =>
    a.assetNumber.localeCompare(b.assetNumber)
  )
  const licences = [...licenceRows].sort((a, b) =>
    a.licenceNumber.localeCompare(b.licenceNumber)
  )

  return { staff, assets, licences }
}
