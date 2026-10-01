import { DisplayAllLicences } from '@/features/licences/components/displayAllLicences'
import { Menu } from '@/features/nav/components/menu'

export default function ManageLicencePage() {
  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex flex-1 justify-center p-4 rounded-xl">
        <DisplayAllLicences />
      </div>
    </div>
  )
}
