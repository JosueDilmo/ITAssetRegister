import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { Menu } from '@/features/nav/components/menu'
import { StaffModule } from '@/features/staff/components/staffModule'

export default async function RegisterStaffPage() {
  const currentUser = await requireAdminOrRedirect()

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center py-2 rounded-xl text-gray-100">
        <StaffModule
          userEmail={currentUser.email || ''}
          userRole={currentUser.role}
          staffEmail=""
        />
      </div>
    </div>
  )
}
