import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { HS_ROLES } from '@/shared/lib/roles'
import { redirect } from 'next/navigation'

// UX only: the Fastify requireAnyRole guard on /api/hs/* is the real
// enforcement (invariant 4). Decides from the full roles array, never the
// single badge role (D-02), and redirects silently to Home (D-06).
export async function requireHsRoleOrRedirect() {
  const user = await getCurrentITAssetUser()

  if (!user) {
    redirect('/signin')
  }

  // Fallback for sessions issued before the roles array existed
  const roles = user.roles ?? (user.role ? [user.role] : [])

  if (!HS_ROLES.some(r => roles.includes(r))) {
    redirect('/')
  }

  return { ...user, roles }
}
