export const LICENCE_TYPE = [
  'SUBSCRIPTION',
  'PERPETUAL',
  'OEM',
  'VOLUME',
] as const
export type LicenceType = (typeof LICENCE_TYPE)[number]

export const LICENCE_STATUS = [
  'ACTIVE',
  'INACTIVE',
  'EXPIRED',
  'RETIRED',
] as const
export type LicenceStatus = (typeof LICENCE_STATUS)[number]
