'use server'
import { auth, signIn, signOut } from '@/app/lib/auth'

export default async function handleAuth() {
  const session = await auth()
  if (session) {
    return signOut({
      redirectTo: '/signin',
    })
  }

  await signIn('microsoft-entra-id', {
    redirectTo: '/',
  })
}
