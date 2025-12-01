import { z } from 'zod'
import { ASSET_ERROR_MESSAGES } from '../constants/errorMessages'

export const assetSchema = z.object({
  serialNumber: z.string().min(2, ASSET_ERROR_MESSAGES.SERIAL_NUMBER),
  name: z.string().min(2, ASSET_ERROR_MESSAGES.NAME),
  type: z.string().min(2, ASSET_ERROR_MESSAGES.TYPE),
  maker: z.string().min(2, ASSET_ERROR_MESSAGES.MAKER),
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
  status: z.string().min(2, ASSET_ERROR_MESSAGES.STATUS),
  note: z.string().min(10, ASSET_ERROR_MESSAGES.NOTE).optional().nullable(),
})
export type AssetDetailsParams = z.infer<typeof AssetDetailsSchema>
