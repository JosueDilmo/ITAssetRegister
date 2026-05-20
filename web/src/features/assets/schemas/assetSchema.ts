import { z } from 'zod'
import { ASSET_ERROR_MESSAGES } from '@/shared/constants/errorMessages'

export const ASSET_STATUS = [
  'ACTIVE',
  'INACTIVE',
  'RETIRED',
  'LOST',
] as const

export const ASSET_CONDITION = [
  'NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
  'IN USE',
  'IN STOCK',
] as const

export const assetSchema = z.object({
  serialNumber: z.string().min(2, ASSET_ERROR_MESSAGES.SERIAL_NUMBER),
  name: z.string().min(2, ASSET_ERROR_MESSAGES.NAME),
  type: z.string().min(2, ASSET_ERROR_MESSAGES.TYPE),
  maker: z.string().min(2, ASSET_ERROR_MESSAGES.MAKER),
  condition: z.enum(ASSET_CONDITION, {
    message: ASSET_ERROR_MESSAGES.CONDITION,
  }),
  assignedTo: z.preprocess(
    value => (value === '' ? null : value),
    z.string().email(ASSET_ERROR_MESSAGES.ASSIGNED_TO).nullable()
  ),
  datePurchased: z.string().date(ASSET_ERROR_MESSAGES.DATE_PURCHASED),
  assetNumber: z
    .string()
    .min(2, ASSET_ERROR_MESSAGES.ASSET_NUMBER)
    .startsWith('IT-', ASSET_ERROR_MESSAGES.ASSET_NUMBER),
})
export type AssetSchemaType = z.infer<typeof assetSchema>

// Schema for editing asset details
export const AssetDetailsSchema = z.object({
  status: z.enum(ASSET_STATUS, { message: ASSET_ERROR_MESSAGES.STATUS }),
  condition: z
    .enum(ASSET_CONDITION, { message: ASSET_ERROR_MESSAGES.CONDITION })
    .optional(),
  note: z.string().min(10, ASSET_ERROR_MESSAGES.NOTE).optional().nullable(),
})
export type AssetDetailsParams = z.infer<typeof AssetDetailsSchema>
