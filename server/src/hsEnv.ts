// Side-effect import: guarantees server/.env is loaded before the HS vars are
// read below. env.ts is gitignored and intentionally not modified (D-24).
import './env.js'
import { z } from 'zod'

// An empty or whitespace-only value counts as unset (D-24).
const optionalId = z.preprocess(
  v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().min(1).optional()
)

// The five SharePoint IDs are all-or-nothing: none set = H&S not configured
// (routes answer 503), all set = configured, partial = refuse to boot.
export const HS_REQUIRED_KEYS = [
  'HS_ME_SITE_ID',
  'HS_ME_DRIVE_ID',
  'HS_QHSE_SITE_ID',
  'HS_QHSE_PREAPPROVED_DRIVE_ID',
  'HS_QHSE_CONTROL_DRIVE_ID',
] as const

export const hsEnvSchema = z
  .object({
    HS_ME_SITE_ID: optionalId,
    HS_ME_DRIVE_ID: optionalId,
    HS_QHSE_SITE_ID: optionalId,
    HS_QHSE_PREAPPROVED_DRIVE_ID: optionalId,
    HS_QHSE_CONTROL_DRIVE_ID: optionalId,
    HS_ME_PROJECTS_ROOT: z.string().trim().min(1).default('01_Proj/Open'),
    HS_ME_PROJECT_HS_PATH: z.string().trim().min(1).default('1. Cons/5. H&S'),
    HS_ME_PERMITS_FOLDER: z.string().trim().min(1).default('Permits'),
    HS_QHSE_PREAPPROVED_ROOT: z.string().trim().default(''),
    HS_QHSE_CONTROL_ROOT: z.string().trim().default(''),
  })
  .superRefine((value, ctx) => {
    const present = HS_REQUIRED_KEYS.filter(key => value[key] !== undefined)
    if (present.length === 0 || present.length === HS_REQUIRED_KEYS.length) {
      return
    }
    for (const key of HS_REQUIRED_KEYS) {
      if (value[key] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when any H&S SharePoint ID is set (all-or-nothing, D-24)`,
        })
      }
    }
  })

export type HsEnv = z.infer<typeof hsEnvSchema>

export function isHsConfigured(
  e: Partial<Record<(typeof HS_REQUIRED_KEYS)[number], string | undefined>>
): boolean {
  return HS_REQUIRED_KEYS.every(key => Boolean(e[key]))
}

// A partial group throws here, so the server refuses to start.
export const hsEnv = hsEnvSchema.parse(process.env)
export const hsConfigured = isHsConfigured(hsEnv)
