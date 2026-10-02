import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { ROLES } from '@/shared/lib/roles'
import { redirect } from 'next/navigation'

// UX only: the Fastify requireRole('admin') guard is the real enforcement (invariant 4).
export async function requireAdminOrRedirect() {
  const user = await getCurrentITAssetUser()

  if (!user) {
    redirect('/signin')
  }

  if (user.role !== ROLES.ADMIN) {
    redirect('/account')
  }

  return { ...user, role: ROLES.ADMIN }
}
