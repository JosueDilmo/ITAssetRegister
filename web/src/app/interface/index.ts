export interface PageProps {
  params: Promise<{ id: string }>
}

export interface AssetInfoProps {
  data: Array<{
    id: string
    serialNumber: string
    name: string
    type: string
    maker: string
    assignedTo: string | null
    dateAssigned: string | null
    datePurchased: string
    assetNumber: string
    createdAt: string
    status: string
    note: string | null
  }>
}

export interface StaffInfoProps {
  data: Array<{
    id: string
    name: string
    email: string
    department: string
    jobTitle: string
    status: string
    note: string | null
    assetHistoryList: string[]
    createdAt: string
  }>
}

export interface AssetProps {
  success: boolean
  message: string
  assetList: {
    id: string
    serialNumber: string
    name: string
    email: string | null
  }[]
}

export interface UserProps {
  staffEmail: string
  userEmail: string
  userRole: string
}

export interface assetNormalizeData {
  serialNumber: string
  name: string
  type: string
  maker: string
  assignedTo: string | null
  datePurchased: string
  assetNumber: string
  createdBy: string
}

export interface staffNormalizeData {
  name: string
  email: string
  department: string
  jobTitle: string
  createdBy: string
}
