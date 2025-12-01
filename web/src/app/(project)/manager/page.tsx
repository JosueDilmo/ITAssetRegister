import { Menu } from '../../(project)/nav/menu'
import { DisplayAllAssets } from './management/asset/displayAllAssets'
import { DisplayAllStaff } from './management/staff/displayAllStaff'

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
