export type AssetList = Array<{
  id: string
  serialNumber: string
  name: string
  type: string
  maker: string
  assignedTo: string | null
  datePurchased: string
  assetNumber: string
  status: string
  note: string | null
  createdAt: string
  createdBy: string
}>
