import { Menu } from '@/features/nav/components/menu'
import { DisplayAllAssets } from '@/features/assets/components/displayAllAssets'
import { DisplayAllStaff } from '@/features/staff/components/displayAllStaff'

export default function ManagementPage() {
  return (
    <div className="flex w-full">
      <Menu />
      <div className="grid grid-cols-2 flex-1 justify-items-center p-4 rounded-xl">
        <DisplayAllStaff />

        <DisplayAllAssets />
      </div>
    </div>
  )
}
