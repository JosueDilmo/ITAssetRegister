import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { ShowAccessDeniedMessage } from '@/features/auth/components/accessDenied'
import { Menu } from '@/features/nav/components/menu'
import { StaffModule } from '@/features/staff/components/staffModule'

export default async function RegisterStaffPage() {
  const currentUser = await getCurrentITAssetUser()
  if (!currentUser) {
    throw new Error('User not found')
  }
  const userRole = currentUser.role
  const currentUserEmail = currentUser?.email

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center py-2 rounded-xl text-gray-100">
        {userRole !== 'admin' ? (
          <ShowAccessDeniedMessage />
        ) : (
          <StaffModule
            userEmail={currentUserEmail || ''}
            userRole={userRole}
            staffEmail=""
          />
        )}
      </div>
    </div>
  )
}
