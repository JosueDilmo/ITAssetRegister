import { z } from 'zod'

const envSchema = z.object({
  // NextAuth
  AUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Microsoft Entra ID
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string(),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string(),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: z.string().url(),

  // Company domains
  AUTH_DOMAIN: z.string(),
  AUTH_ALT_DOMAIN: z.string(),
})

export const env = envSchema.parse(process.env)
