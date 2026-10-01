import type { PostApiNewLicenceBodyLicenceType } from '@/http/api'
import type { licenceNormalizeData } from '@/shared/interface/index'

export function normalizeLicenceData({
  name,
  vendor,
  licenceType,
  licenceKey,
  licenceNumber,
  datePurchased,
  expiryDate,
  cost,
  assignedTo,
  createdBy,
}: licenceNormalizeData) {
  return {
    name: name.toUpperCase().trim(),
    vendor: vendor.toUpperCase().trim(),
    licenceType: licenceType
      .toUpperCase()
      .trim() as PostApiNewLicenceBodyLicenceType,
    licenceKey: licenceKey?.trim() || null,
    licenceNumber: licenceNumber.toUpperCase().trim(),
    datePurchased: datePurchased.trim(),
    expiryDate: expiryDate?.trim() || null,
    cost: cost?.trim() || null,
    assignedTo: assignedTo?.toLowerCase().trim() || null,
    createdBy: createdBy.trim(),
  }
}
