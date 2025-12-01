import { z } from 'zod'
import { STAFF_ERROR_MESSAGES } from '../constants/errorMessages'

export const staffSchema = z.object({
  name: z.string().min(2, STAFF_ERROR_MESSAGES.NAME),
  email: z.string().email(STAFF_ERROR_MESSAGES.EMAIL),
  department: z.string().min(2, STAFF_ERROR_MESSAGES.DEPARTMENT),
  jobTitle: z.string().min(2, STAFF_ERROR_MESSAGES.JOB_TITLE),
})
export type StaffSchemaType = z.infer<typeof staffSchema>

// Schema for editing staff details
export const StaffDetailsSchema = z.object({
  status: z.string().min(2, STAFF_ERROR_MESSAGES.STATUS),
  note: z.preprocess(
    value => (value === '' ? null : value),
    z.string().min(5, STAFF_ERROR_MESSAGES.NOTE).nullable()
  ),
})
export type StaffDetailsParams = z.infer<typeof StaffDetailsSchema>
