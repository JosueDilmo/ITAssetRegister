import { ShowAccessDeniedMessage } from '@/features/auth/components/accessDenied'
import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { AssetModule } from '@/features/assets/components/assetModule'
import { StaffModule } from '@/features/staff/components/staffModule'

export default async function RegisterPage() {
  const currentUser = await getCurrentITAssetUser()
  if (!currentUser) {
    throw new Error('User not found')
  }
  const userRole = currentUser.role
  const currentUserEmail = currentUser?.email

  return (
    <div className="flex w-full">
      <Menu />
      <div className="grid grid-cols-2 flex-1 justify-items-center py-2 rounded-xl text-gray-100">
        {userRole !== 'admin' ? (
          <ShowAccessDeniedMessage />
        ) : (
          <>
            <StaffModule
              userEmail={currentUserEmail || ''}
              userRole={userRole}
              staffEmail=""
            />
            <AssetModule
              userEmail={currentUserEmail || ''}
              userRole={userRole}
              staffEmail=""
            />
          </>
        )}
      </div>
    </div>
  )
}
