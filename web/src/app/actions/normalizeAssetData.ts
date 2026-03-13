import type { assetNormalizeData } from '../interface/index'

export function normalizeAssetData({
  serialNumber,
  name,
  type,
  maker,
  condition,
  assignedTo,
  datePurchased,
  assetNumber,
  createdBy,
}: assetNormalizeData) {
  return {
    serialNumber: serialNumber.toUpperCase().trim(),
    name: name.toUpperCase().trim(),
    type: type.toUpperCase().trim(),
    maker: maker.toUpperCase().trim(),
    condition: condition.toUpperCase().trim(),
    assignedTo: assignedTo?.toLowerCase().trim() || null,
    datePurchased: datePurchased.trim(),
    assetNumber: assetNumber.toUpperCase().trim(),
    createdBy: createdBy.trim(),
  }
}
