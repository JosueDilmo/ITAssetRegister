export interface GetAllStaffParams {
  search?: string
  page?: number
  limit?: number
}

export interface GetAllAssetsParams {
  search?: string
  page?: number
  limit?: number
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
  condition: string
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
  condition?: string
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

export interface CreateLicenceParams {
  name: string
  vendor: string
  licenceType: string
  licenceKey: string | null
  serialNumber?: string | null
  licenceNumber: string
  datePurchased: string
  expiryDate: string | null
  cost: string | null
  assignedTo: string | null
  createdBy: string
}

export interface GetLicenceNumberParams {
  licenceNumber: string
}

export interface PatchLicenceParams {
  id: string
  status: string
  /** undefined = leave the stored note unchanged; null = clear it. */
  note?: string | null
  serialNumber?: string | null
  updatedBy: string
}

export interface AssignLicenceParams {
  userConfirmed?: boolean
  staffEmail: string
  licenceId: string
  updatedBy: string
}

export interface UnassignLicenceParams {
  licenceId: string
  updatedBy: string
  userConfirmed?: boolean
}

export interface GetLicencesByStaffParams {
  staffEmail: string
}

export interface GetStaffByEmailParams {
  email: string
}
