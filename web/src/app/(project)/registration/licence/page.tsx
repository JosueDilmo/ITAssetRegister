import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { LicenceModule } from '@/features/licences/components/licenceModule'
import { Menu } from '@/features/nav/components/menu'

export default async function RegisterLicencePage() {
  const currentUser = await requireAdminOrRedirect()

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center py-2 rounded-xl text-gray-100">
        <LicenceModule
          userEmail={currentUser.email || ''}
          userRole={currentUser.role}
          staffEmail=""
        />
      </div>
    </div>
  )
}
