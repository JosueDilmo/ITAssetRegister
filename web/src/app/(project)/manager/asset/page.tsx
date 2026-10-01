import { DisplayAllAssets } from '@/features/assets/components/displayAllAssets'
import { Menu } from '@/features/nav/components/menu'

export default function ManageAssetPage() {
  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center p-4 rounded-xl">
        <DisplayAllAssets />
      </div>
    </div>
  )
}
