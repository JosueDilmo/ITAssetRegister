export interface PageProps {
  params: Promise<{ id: string }>
}

export interface ChangeLogEntry {
  updatedBy: string
  updatedAt: string
  updatedField: string
  previousValue: (string | null)[]
  newValue: (string | null)[]
}

export interface AssetInfoProps {
  data: Array<{
    id: string
    serialNumber: string
    name: string
    type: string
    maker: string
    condition: string
    assignedTo: string | null
    dateAssigned: string | null
    datePurchased: string
    assetNumber: string
    createdAt: string
    status: string
    note: string | null
    changeLog: ChangeLogEntry[]
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
    assetHistoryList: Array<{ id: string; name: string; serialNumber: string; assetNumber: string }>
    createdAt: string
    changeLog: ChangeLogEntry[]
  }>
}

export interface AssetProps {
  success: boolean
  message: string
  assetList: {
    id: string
    serialNumber: string
    name: string
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
  condition: string
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
