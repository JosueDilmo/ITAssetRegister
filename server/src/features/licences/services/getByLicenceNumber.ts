import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetLicenceNumberParams } from '../../../types/index.js'

export async function getByLicenceNumber({
  licenceNumber,
}: GetLicenceNumberParams) {
  const licence = await db
    .select({
      id: licenceTab.id,
      name: licenceTab.name,
      vendor: licenceTab.vendor,
      licenceType: licenceTab.licenceType,
      serialNumber: licenceTab.serialNumber,
      licenceNumber: licenceTab.licenceNumber,
      assignedTo: licenceTab.assignedTo,
      datePurchased: licenceTab.datePurchased,
      expiryDate: licenceTab.expiryDate,
      cost: licenceTab.cost,
      status: licenceTab.status,
      note: licenceTab.note,
      createdAt: licenceTab.createdAt,
      createdBy: licenceTab.createdBy,
    })
    .from(licenceTab)
    .where(eq(licenceTab.licenceNumber, licenceNumber))

  if (licence.length === 0) {
    throw new NotFoundError(
      `${ERROR_MESSAGES.LICENCE_NUMBER_NOT_FOUND} Number: ${licenceNumber}`
    )
  }

  const licenceDetails = licence.map(l => ({
    id: l.id,
    name: l.name,
    vendor: l.vendor,
    licenceType: l.licenceType,
    serialNumber: l.serialNumber,
    licenceNumber: l.licenceNumber,
    assignedTo: l.assignedTo,
    datePurchased: l.datePurchased,
    expiryDate: l.expiryDate,
    cost: l.cost,
    status: l.status,
    note: l.note,
    createdAt: l.createdAt,
    createdBy: l.createdBy,
  }))

  return {
    success: true,
    message: 'Licence retrieved successfully',
    licenceDetails,
  }
}
