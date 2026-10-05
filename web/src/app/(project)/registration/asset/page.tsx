import { AssetModule } from '@/features/assets/components/assetModule'
import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { Menu } from '@/features/nav/components/menu'

export default async function RegisterAssetPage() {
  const currentUser = await requireAdminOrRedirect()

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center py-2 rounded-xl text-gray-100">
        <AssetModule
          userEmail={currentUser.email || ''}
          userRole={currentUser.role}
          staffEmail=""
        />
      </div>
    </div>
  )
}
