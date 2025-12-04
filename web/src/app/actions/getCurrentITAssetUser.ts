import { auth } from '../lib/auth'

export async function getCurrentITAssetUser() {
  const session = await auth()
  if (!session) {
    return null
  }

  const user = {
    id: session.user?.id,
    role: session.user?.role,
    email: session.user?.email,
    name: session.user?.name,
    image: session.user?.image,
  }

  return user
}
