import { ProfileCard } from '@/features/account/components/ProfileCard'
import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { getApiMe } from '@/http/api'
import { redirect } from 'next/navigation'

// Every signed-in user (admins included) may open this page, so it only
// checks for a session and never uses the admin guard.
export default async function AccountPage() {
  const user = await getCurrentITAssetUser()
  if (!user?.email) redirect('/signin')

  // No arguments: identity is resolved server-side from the session (D-03).
  const me = await getApiMe().catch(() => null)

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <h1 className="font-heading text-lg font-semibold text-gray-50">
            My Account
          </h1>
          <ProfileCard
            staff={me?.staff ?? null}
            email={user.email}
            failed={me === null}
          />
        </div>
      </main>
    </div>
  )
}
