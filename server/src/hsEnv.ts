// Side-effect import: guarantees server/.env is loaded before the HS vars are
// read below. env.ts is gitignored and intentionally not modified (D-24).
import './env.js'
import { z } from 'zod'

// An empty or whitespace-only value counts as unset (D-24).
const optionalId = z.preprocess(
  v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().min(1).optional()
)

// A drive-relative folder path: no leading/trailing slash, no empty segment and
// no '.' or '..' segment. graphDriveClient.encodePath throws on these at call
// time, which would surface a config typo as a SharePoint outage; failing at
// boot makes the typo visible instead.
const isValidFolderPath = (value: string): boolean =>
  value
    .split('/')
    .every(segment => segment !== '' && segment !== '.' && segment !== '..')

const FOLDER_PATH_MESSAGE =
  'must be a relative folder path with no leading/trailing "/", empty segment, "." or ".." segment'

// An empty value counts as unset, so the default applies (D-24).
const defaultedFolderPath = (fallback: string) =>
  z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .refine(isValidFolderPath, { message: FOLDER_PATH_MESSAGE })
      .default(fallback)
  )

// Optional drive-root path: empty means the drive root.
const optionalFolderPath = z
  .string()
  .trim()
  .refine(v => v === '' || isValidFolderPath(v), {
    message: FOLDER_PATH_MESSAGE,
  })
  .default('')

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
    HS_ME_PROJECTS_ROOT: defaultedFolderPath('01_Proj/Open'),
    HS_ME_PROJECT_HS_PATH: defaultedFolderPath('1. Cons/5. H&S'),
    HS_ME_PERMITS_FOLDER: defaultedFolderPath('Permits'),
    HS_QHSE_PREAPPROVED_ROOT: optionalFolderPath,
    HS_QHSE_CONTROL_ROOT: optionalFolderPath,
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
