import { LICENCE_ERROR_MESSAGES } from '@/shared/constants/errorMessages'
import { z } from 'zod'

export const LICENCE_STATUS = [
  'ACTIVE',
  'INACTIVE',
  'EXPIRED',
  'RETIRED',
] as const

export const LICENCE_TYPE = [
  'SUBSCRIPTION',
  'PERPETUAL',
  'OEM',
  'VOLUME',
] as const

export const licenceSchema = z.object({
  name: z.string().min(2, LICENCE_ERROR_MESSAGES.NAME),
  vendor: z.string().min(2, LICENCE_ERROR_MESSAGES.VENDOR),
  licenceType: z.enum(LICENCE_TYPE, {
    message: LICENCE_ERROR_MESSAGES.LICENCE_TYPE,
  }),
  licenceKey: z.preprocess(
    value => (value === '' ? null : value),
    z.string().nullable()
  ),
  serialNumber: z.preprocess(
    value => (value === '' ? null : value),
    z.string().nullable().optional()
  ),
  licenceNumber: z
    .string()
    .min(2, LICENCE_ERROR_MESSAGES.LICENCE_NUMBER)
    .startsWith('LIC-', LICENCE_ERROR_MESSAGES.LICENCE_NUMBER),
  datePurchased: z.string().date(LICENCE_ERROR_MESSAGES.DATE_PURCHASED),
  expiryDate: z.preprocess(
    value => (value === '' ? null : value),
    z.string().date(LICENCE_ERROR_MESSAGES.EXPIRY_DATE).nullable()
  ),
  cost: z.preprocess(
    value => (value === '' ? null : value),
    z.string().nullable()
  ),
  assignedTo: z.preprocess(
    value => (value === '' ? null : value),
    z.string().email(LICENCE_ERROR_MESSAGES.ASSIGNED_TO).nullable()
  ),
})
export type LicenceSchemaType = z.infer<typeof licenceSchema>

export const LicenceDetailsSchema = z.object({
  status: z.enum(LICENCE_STATUS, { message: LICENCE_ERROR_MESSAGES.STATUS }),
  note: z.string().min(10, LICENCE_ERROR_MESSAGES.NOTE).optional().nullable(),
})
export type LicenceDetailsParams = z.infer<typeof LicenceDetailsSchema>
