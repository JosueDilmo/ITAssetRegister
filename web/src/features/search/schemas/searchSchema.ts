import {
  ASSET_ERROR_MESSAGES,
  LICENCE_ERROR_MESSAGES,
} from '@/shared/constants/errorMessages'
import { z } from 'zod'

export const SearchSchema = z.object({
  serialNumber: z.string().min(4, ASSET_ERROR_MESSAGES.SERIAL_NUMBER),
})
export type SearchSchema = z.infer<typeof SearchSchema>

export const LicenceSearchSchema = z.object({
  licenceNumber: z
    .string()
    .startsWith('LIC-', LICENCE_ERROR_MESSAGES.LICENCE_NUMBER),
})
export type LicenceSearchSchema = z.infer<typeof LicenceSearchSchema>
