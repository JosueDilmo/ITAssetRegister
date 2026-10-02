import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { getApiStaffByEmailEmail } from '@/http/api'
import { redirect } from 'next/navigation'

// Opens the signed-in user's own staff detail page (read-only for non-admins).
// The Home "IT Assets" card points non-admin users here.
export default async function MyStaffPage() {
  const user = await getCurrentITAssetUser()
  if (!user?.email) redirect('/signin')

  const staffId = await getApiStaffByEmailEmail(user.email)
    .then(r => r.staff.id)
    .catch((e: { error?: { code?: string } }) => {
      if (e?.error?.code === 'NOT_FOUND') return null
      throw e
    })

  if (staffId) redirect(`/manager/${staffId}`)

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded border border-gray-600 bg-gray-800 p-6 text-center">
          <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-gray-100">
            No staff record found
          </h2>
          <p className="text-sm text-gray-400">
            There is no staff record for {user.email} yet, so there are no
            assets or licences to show. Contact IT support to be added.
          </p>
        </div>
      </div>
    </div>
  )
}
