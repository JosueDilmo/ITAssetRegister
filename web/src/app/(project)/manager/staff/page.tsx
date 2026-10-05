import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { Menu } from '@/features/nav/components/menu'
import { DisplayAllStaff } from '@/features/staff/components/displayAllStaff'

export default async function ManageStaffPage() {
  await requireAdminOrRedirect()

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center p-4 rounded-xl">
        <DisplayAllStaff />
      </div>
    </div>
  )
}
