export interface GetAllStaffParams {
  orderBy: 'name' | 'department' | 'email' | 'createdAt'
  page: number
  search?: string
}

export type ChangeLogEntry = {
  updatedBy: string
  updatedAt: string
  updatedField: string
  previousValue: string[]
  newValue: string[]
}

export interface AssignAssetWithConfirmationParams {
  userConfirmed?: boolean
  staffEmail: string
  assetId: string
  updatedBy: string
}
export interface CreateAssetParams {
  serialNumber: string
  name: string
  type: string
  maker: string
  assignedTo: string | null
  datePurchased: string
  assetNumber: string
  createdBy: string
}

export interface GetAssetSerialParams {
  serialNumber: string
}

export interface GetAssetParams {
  staffEmail: string
}

export interface GetByIdParams {
  id: string
}

export interface DeleteAssetParams {
  assetId: string
  updatedBy: string
  userConfirmed?: boolean
}

export interface PatchDetailsParams {
  id: string
  status: string
  note: string | null
  updatedBy: string
}

export interface CreateStaffParams {
  name: string
  email: string
  department: string
  jobTitle: string
  createdBy: string
}
