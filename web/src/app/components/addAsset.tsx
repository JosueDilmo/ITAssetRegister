import { postApiAssetToStaffEmail, PostApiAssetToStaffEmail200, PostApiAssetToStaffEmail409 } from '@/http/api'
import * as Icons from 'lucide-react'
import { toast } from 'react-toastify'
import type { UserProps } from '../interface/index'
import type { AssetList } from '../types/index'
import { BoxField, BoxRoot } from './box'

export function AddAsset({
  staffEmail,
  userEmail,
  userRole,
  asset,
}: UserProps & { asset: AssetList }) {
  if (userRole !== 'admin') {
    return null
  }
  async function handleAddAsset(id: string) {
    const response = await postApiAssetToStaffEmail(staffEmail, {
      assetId: id,
      updatedBy: userEmail,
    })

    const success = response.success
    const message = success ? (response as PostApiAssetToStaffEmail200).message : (response as unknown as PostApiAssetToStaffEmail409).error.message
    if (success) {
      toast.success(message)
    } else {
      const confirmRetry = window.confirm(message)
      if (confirmRetry) {
        const retryResponse = await postApiAssetToStaffEmail(
          staffEmail,
          {
            assetId: id,
            updatedBy: userEmail,
            userConfirmed: true,
          }
        )
        const retrySuccess = retryResponse.success
        const retryMessage = retrySuccess ? (retryResponse as PostApiAssetToStaffEmail200).message : (retryResponse as unknown as PostApiAssetToStaffEmail409).error.message
        toast[retrySuccess ? 'success' : 'error'](retryMessage)
      }
    }
    window.location.reload()
  }

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {asset.map((asset, index) => (
        <BoxRoot
          key={index}
          className="flex h-16 items-center p-2 shadow-sm hover:shadow-lg shadow-blue-500 bg-gray-700 rounded-md mb-4"
        >
          <div className="flex flex-col">
            <BoxField
              goToAsset={asset.id}
              className="font-medium hover:underline hover:cursor-pointer"
            >
              {asset.name}
            </BoxField>
            <span className="text-gray-200 text-sm">
              <span className="text-gray-50">SN:</span> {asset.serialNumber}
            </span>
          </div>
          <button
            className="ml-auto flex items-center justify-center w-6 h-6 rounded-full hover:bg-green-900 hover:cursor-pointer"
            type="button"
            onClick={() => handleAddAsset(asset.id)}
          >
            <Icons.Plus className="text-gray-50 hover:text-gray-900 w-4 h-4" />
          </button>
        </BoxRoot>
      ))}
    </div>
  )
}
