export type AssetList = Array<{
  id: string
  serialNumber: string
  name: string
  type: string
  maker: string
  condition: string
  assignedTo: string | null
  datePurchased: string
  assetNumber: string
  status: string
  note: string | null
  createdAt: string
  createdBy: string
}>

export type StaffList = Array<{
  id: string
  name: string
  email: string
  department: string
  jobTitle: string
  status: string
  note: string | null
  assetHistoryList: Array<string | null>
  createdAt: string
  createdBy: string
  changeLog: Array<{
    updatedBy: string
    updatedAt: string
    updatedField: string
    previousValue: Array<string | null>
    newValue: Array<string | null>
  }>
}>
