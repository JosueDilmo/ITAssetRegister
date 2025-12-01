import { createReadStream } from 'node:fs'
import { parse } from 'csv-parse'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'

const filePath = 'src/functions/import/asset.csv' // Adjust path as needed

async function importAsset() {
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, trim: true })
  )

  let firstRow = true
  let nameKey = 'name'
  for await (const asset of parser) {
    if (firstRow) {
      const keys = Object.keys(asset)
      console.log('Parsed keys:', keys)
      // Find the key that matches 'name' ignoring BOM or whitespace
      nameKey =
        keys.find(k => k.trim().toLowerCase().endsWith('name')) || 'name'
      console.log('Detected name key:', nameKey)
      firstRow = false
    }
    // Robust check for missing or empty required fields
    if (
      typeof asset['serialNumber'] !== 'string' ||
      asset['serialNumber'].trim() === '' ||
      typeof asset[nameKey] !== 'string' ||
      asset[nameKey].trim() === '' ||
      typeof asset['type'] !== 'string' ||
      asset['type'].trim() === '' ||
      typeof asset['maker'] !== 'string' ||
      asset['maker'].trim() === '' ||
      typeof asset['assetNumber'] !== 'string' ||
      asset['assetNumber'].trim() === '' ||
      typeof asset['datePurchased'] !== 'string' ||
      asset['datePurchased'].trim() === ''
    ) {
      console.error(
        'Skipping row due to missing or empty required fields:',
        asset
      )
      console.error('Field types:', {
        serialNumber: typeof asset['serialNumber'],
        name: typeof asset[nameKey],
        type: typeof asset['type'],
        maker: typeof asset['maker'],
        assetNumber: typeof asset['assetNumber'],
        datePurchased: typeof asset['datePurchased'],
      })
      console.error('Field values:', {
        serialNumber: JSON.stringify(asset['serialNumber']),
        name: JSON.stringify(asset[nameKey]),
        type: JSON.stringify(asset['type']),
        maker: JSON.stringify(asset['maker']),
        assetNumber: JSON.stringify(asset['assetNumber']),
        datePurchased: JSON.stringify(asset['datePurchased']),
      })
      continue
    }
    try {
      await db.insert(assetTab).values({
        id: asset['id'],
        serialNumber: asset['serialNumber'].trim(),
        name: asset[nameKey].trim(),
        type: asset['type'].trim(),
        maker: asset['maker'].trim(),
        assignedTo: asset['assignedTo']?.trim() || null,
        dateAssigned: asset['dateAssigned']?.trim() || null,
        datePurchased: asset['datePurchased'].trim(),
        assetNumber: asset['assetNumber'].trim(),
        status: asset['status']?.trim() || 'ACTIVE',
        note: asset['note']?.trim() || '',
        createdAt: new Date(),
        createdBy: 'import-script',
        changeLog: [],
      })
      console.log(`Imported: ${asset['serialNumber']}`)
    } catch (err) {
      console.error(
        `Error importing ${asset['serialNumber']}:`,
        (err as Error).message
      )
    }
  }
  console.log('Asset import complete!')
}

importAsset()
