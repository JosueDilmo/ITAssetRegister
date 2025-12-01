import { getCurrentITAssetUser } from '@/app/actions/getCurrentITAssetUser'
import type { PageProps } from '@/app/interface/index'
import { getAllAssets, getAllStaff } from '@/http/api'
import { EditAssetInfo } from '../../manager/management/asset/editAssetInfo'
import { EditStaffInfo } from '../../manager/management/staff/editStaffInfo'
import { Menu } from '../../nav/menu'

export default async function DisplayPage(props: PageProps) {
  const { id } = await props.params
  const currentUser = await getCurrentITAssetUser()
  if (!currentUser) {
    throw new Error('User not found')
  }
  const currentUserEmail = currentUser?.email
  const currentUserRole = currentUser?.role

  const staffData = id ? await getAllStaff({ id }) : []
  const assetData = id ? await getAllAssets({ id }) : []

  const hasStaffData = staffData && staffData.length > 0
  const hasAssetData = assetData && assetData.length > 0

  return (
    <div className="flex w-full">
      <Menu />
      <div className="justify-items-center p-4 rounded-xl">
        {hasStaffData && (
          <EditStaffInfo
            data={staffData}
            userEmail={currentUserEmail || ''}
            userRole={currentUserRole || ''}
            staffEmail=""
          />
        )}
        {hasAssetData && (
          <EditAssetInfo
            data={assetData}
            userEmail={currentUserEmail || ''}
            userRole={currentUserRole || ''}
            staffEmail=""
          />
        )}
      </div>
    </div>
  )
}
