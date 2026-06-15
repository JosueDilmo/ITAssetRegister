import NextAuth from 'next-auth'
import type { User as NextAuthUser } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { env } from './env'
import { ROLES, highestRole } from './roles'

// Roles come from Entra ID app roles (see web/src/shared/lib/roles.ts):
// admin | hr | hs_officer | dept_manager | staff (default when unassigned)

// Extend the User and Session types to include role info
declare module 'next-auth' {
  interface User {
    role?: string
    roles?: string[]
  }
  interface Session {
    user: NextAuthUser & { role?: string; roles?: string[] }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
    }),
  ],
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
      },
    },
  },
  callbacks: {
    async signIn({ profile }) {
      // Only allow users from the company domain
      if (
        !profile?.email ||
        (!profile.email.endsWith(env.AUTH_ALT_DOMAIN!) &&
          !profile.email.endsWith(env.AUTH_DOMAIN!))
      ) {
        return false
      }
      return true
    },
    async jwt({ token, account }) {
      // If the user has an account, decode app roles from the id_token
      if (account?.id_token) {
        try {
          const payload = JSON.parse(
            Buffer.from(account.id_token.split('.')[1], 'base64').toString()
          )
          const rolesArr = (payload as { roles?: string[] }).roles
          const roles =
            Array.isArray(rolesArr) && rolesArr.length > 0
              ? rolesArr
              : [ROLES.STAFF]
          token.roles = roles
          token.role = highestRole(roles)
        } catch (error) {
          console.error('Error decoding JWT:', error)
          token.roles = [ROLES.STAFF]
          token.role = ROLES.STAFF
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add role info to session
      session.user.role = token.role as string | undefined
      session.user.roles = token.roles as string[] | undefined
      return session
    },
  },
})
