import NextAuth from 'next-auth'
import type { User as NextAuthUser } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { env } from './env'

// Roles
// - admin: Full access to all resources
// - viewer: Read-only access to resources

// Extend the User and Session types to include 'role'
declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: NextAuthUser & { role?: string }
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
      // If the user has an account, check for roles
      if (account?.id_token) {
        try {
          // Decode the JWT to extract roles
          const payload = JSON.parse(
            Buffer.from(account.id_token.split('.')[1], 'base64').toString()
          )
          // Check if roles exist and assign 'admin' or 'viewer'
          const rolesArr = (payload as { roles?: string[] }).roles
          token.role =
            Array.isArray(rolesArr) && rolesArr.includes('admin')
              ? 'admin'
              : 'viewer'
        } catch (error) {
          console.error('Error decoding JWT:', error)
          token.role = 'viewer' // Default to viewer if there's an error
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add role to session
      session.user.role = token.role as string | undefined
      return session
    },
  },
})
