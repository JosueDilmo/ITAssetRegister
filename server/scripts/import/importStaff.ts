import { createReadStream } from 'node:fs'
import { parse } from 'csv-parse'
import { db } from '../../src/drizzle/client'
import { staffTab } from '../../src/drizzle/schema/staffTab'
import {
  normalizeDepartment,
  normalizeEmail,
  normalizeJobTitle,
  normalizeName,
} from '../../src/functions/utils/normalize'

const filePath = 'src/functions/import/staff.csv' // Adjust path as needed

async function importStaff() {
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, trim: true })
  )

  let firstRow = true
  let nameKey = 'name'
  for await (const staff of parser) {
    if (firstRow) {
      const keys = Object.keys(staff)
      console.log('Parsed keys:', keys)
      // Find the key that matches 'name' ignoring BOM or whitespace
      nameKey =
        keys.find(k => k.trim().toLowerCase().endsWith('name')) || 'name'
      console.log('Detected name key:', nameKey)
      firstRow = false
    }
    // Robust check for missing or empty required fields
    if (
      typeof staff[nameKey] !== 'string' ||
      staff[nameKey].trim() === '' ||
      typeof staff['email'] !== 'string' ||
      staff['email'].trim() === '' ||
      typeof staff['department'] !== 'string' ||
      staff['department'].trim() === '' ||
      typeof staff['jobTitle'] !== 'string' ||
      staff['jobTitle'].trim() === '' ||
      typeof staff['status'] !== 'string' ||
      staff['status'].trim() === ''
    ) {
      console.error(
        'Skipping row due to missing or empty required fields:',
        staff
      )
      console.error('Field types:', {
        name: typeof staff[nameKey],
        email: typeof staff['email'],
        department: typeof staff['department'],
        jobTitle: typeof staff['jobTitle'],
        status: typeof staff['status'],
      })
      console.error('Field values:', {
        name: JSON.stringify(staff[nameKey]),
        email: JSON.stringify(staff['email']),
        department: JSON.stringify(staff['department']),
        jobTitle: JSON.stringify(staff['jobTitle']),
        status: JSON.stringify(staff['status']),
      })
      continue
    }
    try {
      // Normalize all fields first
      const normalizedName = normalizeName(staff[nameKey])
      const normalizedEmail = normalizeEmail(staff['email'])
      const normalizedDepartment = normalizeDepartment(staff['department'])
      const normalizedJobTitle = normalizeJobTitle(staff['jobTitle'])
      const normalizedStatus = staff['status']?.trim().toUpperCase() || 'ACTIVE'
      const normalizedNote = staff['note']?.trim() || ''

      await db.insert(staffTab).values({
        id: staff['id'],
        name: normalizedName,
        email: normalizedEmail,
        department: normalizedDepartment,
        jobTitle: normalizedJobTitle,
        status: normalizedStatus,
        note: normalizedNote,
        assetHistoryList: [],
        createdAt: new Date(),
        createdBy: 'import-script',
        changeLog: [],
      })
      console.log(`Imported: ${normalizedEmail}`)
    } catch (err) {
      console.error(
        `Error importing ${staff['email']}:`,
        (err as Error).message
      )
    }
  }
  console.log('Staff import complete!')
}

importStaff()
