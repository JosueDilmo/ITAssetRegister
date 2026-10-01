import { Menu } from '@/features/nav/components/menu'
import { DisplayAllStaff } from '@/features/staff/components/displayAllStaff'

export default function ManageStaffPage() {
  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center p-4 rounded-xl">
        <DisplayAllStaff />
      </div>
    </div>
  )
}
