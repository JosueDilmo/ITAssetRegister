export const ASSET_STATUS = [
  'ACTIVE',
  'INACTIVE',
  'RETIRED',
  'LOST',
] as const
export type AssetStatus = (typeof ASSET_STATUS)[number]

export const ASSET_CONDITION = [
  'NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
  'IN USE',
  'IN STOCK',
] as const
export type AssetCondition = (typeof ASSET_CONDITION)[number]

export const STAFF_STATUS = ['ACTIVE', 'INACTIVE'] as const
export type StaffStatus = (typeof STAFF_STATUS)[number]
