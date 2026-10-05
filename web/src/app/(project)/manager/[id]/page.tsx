import { EditAssetInfo } from '@/features/assets/components/editAssetInfo'
import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { EditLicenceInfo } from '@/features/licences/components/editLicenceInfo'
import { Menu } from '@/features/nav/components/menu'
import { EditStaffInfo } from '@/features/staff/components/editStaffInfo'
import {
  getApiAssetWithId,
  getApiLicenceWithIdId,
  getApiStaffById,
} from '@/http/api'
import type { PageProps } from '@/shared/interface/index'

export default async function DisplayPage(props: PageProps) {
  const { id } = await props.params
  const currentUser = await requireAdminOrRedirect()
  const currentUserEmail = currentUser.email
  const currentUserRole = currentUser.role

  const staffData = await getApiStaffById(id)
    .then(r => (Array.isArray(r.staffDetails) ? r.staffDetails : []))
    .catch((e: { error?: { code?: string } }) => {
      if (e?.error?.code === 'NOT_FOUND') return []
      throw e
    })

  const assetData = await getApiAssetWithId(id)
    .then(r => (Array.isArray(r.assetDetails) ? r.assetDetails : []))
    .catch((e: { error?: { code?: string } }) => {
      if (e?.error?.code === 'NOT_FOUND') return []
      throw e
    })

  const licenceData = await getApiLicenceWithIdId(id)
    .then(r => (Array.isArray(r.licence) ? r.licence : []))
    .catch((e: { error?: { code?: string } }) => {
      if (e?.error?.code === 'NOT_FOUND') return []
      throw e
    })

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
        {licenceData.length > 0 && (
          <EditLicenceInfo
            data={licenceData}
            userEmail={currentUserEmail || ''}
            userRole={currentUserRole || ''}
            staffEmail=""
          />
        )}
      </div>
    </div>
  )
}
