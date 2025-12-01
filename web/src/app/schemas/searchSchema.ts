import { z } from 'zod'
import { ASSET_ERROR_MESSAGES } from '../constants/errorMessages'

export const SearchSchema = z.object({
  serialNumber: z.string().min(4, ASSET_ERROR_MESSAGES.SERIAL_NUMBER),
})
export type SearchSchema = z.infer<typeof SearchSchema>
