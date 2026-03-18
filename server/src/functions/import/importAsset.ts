import { createReadStream } from 'node:fs'
import { parse } from 'csv-parse'
import { db } from '../../drizzle/client'
import { assetTab } from '../../drizzle/schema/assetTab'

const filePath = 'src/functions/import/asset.csv' // Adjust path as needed

function convertDateString(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  // Accept YYYY-MM-DD as valid (including 1900-01-01)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (dd.length > 0 && mm.length > 0 && yyyy.length === 4) {
      const day = dd.padStart(2, '0');
      const month = mm.padStart(2, '0');
      return `${yyyy}-${month}-${day}`;
    }
  }
  return null;
}

async function importAsset() {
  const parser = createReadStream(filePath).pipe(
    parse({
      bom: true,
      trim: true,
      columns: (header: string[]) =>
        header.map(col => col.replace(/^\uFEFF/, '').trim()),
    })
  );

  // Robust check for missing or empty required fields
  let firstRow = true;
  let serialNumberKey = 'serialNumber';
  let nameKey = 'name';

  for await (const asset of parser) {
    if (firstRow) {
      const keys = Object.keys(asset);
      serialNumberKey =
        keys.find(k => k.trim().toLowerCase() === 'serialnumber') ||
        'serialNumber';
      nameKey =
        keys.find(k => k.trim().toLowerCase().endsWith('name')) || 'name';
      firstRow = false;
    }

    // Convert dates before using in insert
    const dateAssignedConv = convertDateString(asset['dateAssigned']?.trim());
    const datePurchasedConv = convertDateString(asset['datePurchased']?.trim());

    if (
      typeof asset[serialNumberKey] !== 'string' ||
      asset[serialNumberKey].trim() === '' ||
      typeof asset[nameKey] !== 'string' ||
      asset[nameKey].trim() === '' ||
      typeof asset['maker'] !== 'string' ||
      asset['maker'].trim() === '' ||
      typeof asset['type'] !== 'string' ||
      asset['type'].trim() === '' ||
      typeof asset['assignedTo'] !== 'string' ||
      asset['assignedTo'].trim() === '' ||
      typeof asset['assetNumber'] !== 'string' ||
      asset['assetNumber'].trim() === '' ||
      typeof asset['status'] !== 'string' ||
      asset['status'].trim() === '' ||
      typeof asset['condition'] !== 'string' ||
      asset['condition'].trim() === '' ||
      typeof asset['note'] !== 'string' ||
      asset['note'].trim() === '' ||
      typeof asset['dateAssigned'] !== 'string' ||
      asset['dateAssigned'].trim() === '' ||
      !dateAssignedConv ||
      typeof asset['datePurchased'] !== 'string' ||
      asset['datePurchased'].trim() === '' ||
      !datePurchasedConv
    ) {
      console.error(
        'Skipping row due to missing or empty required fields or invalid datePurchased/dateAssigned:',
        asset
      );
      console.error('Field types:', {
        serialNumber: typeof asset['serialNumber'],
        name: typeof asset[nameKey],
        maker: typeof asset['maker'],
        type: typeof asset['type'],
        assignedTo: typeof asset['assignedTo'],
        assetNumber: typeof asset['assetNumber'],
        status: typeof asset['status'],
        condition: typeof asset['condition'],
        note: typeof asset['note'],
        dateAssigned: typeof asset['dateAssigned'],
        datePurchased: typeof asset['datePurchased'],
      });
      console.error('Field values:', {
        serialNumber: JSON.stringify(asset['serialNumber']),
        name: JSON.stringify(asset[nameKey]),
        maker: JSON.stringify(asset['maker']),
        type: JSON.stringify(asset['type']),
        assetNumber: JSON.stringify(asset['assetNumber']),
        status: JSON.stringify(asset['status']),
        condition: JSON.stringify(asset['condition']),
        note: JSON.stringify(asset['note']),
        dateAssigned: JSON.stringify(asset['dateAssigned']),
        datePurchased: JSON.stringify(asset['datePurchased']),
      });
      continue;
    }
    try {
      await db.insert(assetTab).values({
        id: asset['id'],
        serialNumber: asset[serialNumberKey].trim(),
        name: asset[nameKey].trim(),
        maker: asset['maker'].trim(),
        type: asset['type'].trim(),
        assignedTo: asset['assignedTo']?.trim() || null,
        assetNumber: asset['assetNumber'].trim(),
        status: asset['status']?.trim() || 'ACTIVE',
        condition: asset['condition']?.trim() || '',
        note: asset['note']?.trim() || '',
        dateAssigned: dateAssignedConv,
        datePurchased: datePurchasedConv,
        createdAt: new Date(),
        createdBy: 'import-script',
        changeLog: [],
      });
      console.log(`Imported: ${asset[serialNumberKey]}`);
    } catch (err) {
      console.error(
        `Error importing ${asset[serialNumberKey]}:`,
        (err as Error).message
      );
    }
  }
  console.log('Asset import complete!');
}

importAsset();
