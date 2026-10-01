import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { licenceTab } from '../../../drizzle/schema/licenceTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import type { GetByIdParams } from '../../../types/index.js'

export async function getById({ id }: GetByIdParams) {
  const licenceQuery = await db
    .select({
      id: licenceTab.id,
      name: licenceTab.name,
      vendor: licenceTab.vendor,
      licenceType: licenceTab.licenceType,
      licenceKey: licenceTab.licenceKey,
      licenceNumber: licenceTab.licenceNumber,
      datePurchased: licenceTab.datePurchased,
      expiryDate: licenceTab.expiryDate,
      seatsTotal: licenceTab.seatsTotal,
      cost: licenceTab.cost,
      assignedTo: licenceTab.assignedTo,
      dateAssigned: licenceTab.dateAssigned,
      status: licenceTab.status,
      note: licenceTab.note,
      createdAt: licenceTab.createdAt,
      createdBy: licenceTab.createdBy,
      changeLog: licenceTab.changeLog,
    })
    .from(licenceTab)
    .where(eq(licenceTab.id, id))

  if (licenceQuery.length === 0) {
    throw new NotFoundError(`${ERROR_MESSAGES.LICENCE_NOT_FOUND} ID: ${id}`)
  }

  const licence = licenceQuery.map(l => ({
    ...l,
    changeLog: l.changeLog as Array<{
      updatedBy: string
      updatedAt: string
      updatedField: string
      previousValue: string[]
      newValue: string[]
    }>,
  }))

  return { licence }
}
