import { getCurrentITAssetUser } from '@/app/actions/getCurrentITAssetUser'
import type { PageProps } from '@/app/interface/index'
import { getApiAssetWithId, getApiStaffById } from '@/http/api'
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

  const { staffDetails } = await getApiStaffById(id)
  const staffData = Array.isArray(staffDetails) ? staffDetails : []

  const { assetDetails } = await getApiAssetWithId(id)
  const assetData = Array.isArray(assetDetails) ? assetDetails : []

  return (
    <div className="flex w-full">
      <Menu />
      <div className="justify-items-center p-4 rounded-xl">
        {staffData.length > 0 && (
          <EditStaffInfo
            data={staffData}
            userEmail={currentUserEmail || ''}
            userRole={currentUserRole || ''}
            staffEmail=""
          />
        )}
        {assetData.length > 0 && (
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
