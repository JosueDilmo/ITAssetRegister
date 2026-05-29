'use client'
import { postApiAssetToStaffEmail, type PostApiAssetToStaffEmail200, type PostApiAssetToStaffEmail409 } from '@/http/api'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import type { UserProps } from '@/shared/interface/index'
import type { AssetList } from '@/shared/types/index'

export function AddAsset({
  staffEmail,
  userEmail,
  userRole,
  asset,
}: UserProps & { asset: AssetList }) {
  if (userRole !== 'admin' || asset.length === 0) return null

  async function handleAddAsset(id: string) {
    const response = await postApiAssetToStaffEmail(staffEmail, {
      assetId: id,
      updatedBy: userEmail,
    })
    const success = response.success
    const message = success
      ? (response as PostApiAssetToStaffEmail200).message
      : (response as unknown as PostApiAssetToStaffEmail409).error.message
    if (success) {
      toast.success(message)
    } else {
      const confirmRetry = window.confirm(message)
      if (confirmRetry) {
        const retryResponse = await postApiAssetToStaffEmail(staffEmail, {
          assetId: id,
          updatedBy: userEmail,
          userConfirmed: true,
        })
        const retrySuccess = retryResponse.success
        const retryMessage = retrySuccess
          ? (retryResponse as PostApiAssetToStaffEmail200).message
          : (retryResponse as unknown as PostApiAssetToStaffEmail409).error.message
        toast[retrySuccess ? 'success' : 'error'](retryMessage)
      }
    }
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-1.5 mt-3">
      {asset.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md hover:border-blue/50 transition-colors duration-150 border-l-2 ${
            item.status === 'ACTIVE' ? 'border-l-green-500' : 'border-l-red'
          }`}
        >
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/manager/${item.id}`}
                className="text-sm text-blue hover:underline font-medium truncate"
              >
                {item.name}
              </Link>
              <span className="font-mono text-xs text-gray-100/60 shrink-0">
                {item.type} · {item.maker}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-100/60">{item.serialNumber}</span>
              {item.assignedTo ? (
                <span className="flex items-center gap-1 text-xs font-mono text-orange-500 truncate">
                  <Icons.AlertTriangle className="w-3 h-3 shrink-0" />
                  {item.assignedTo}
                </span>
              ) : (
                <span className="text-xs font-mono text-gray-100/30 italic">Unassigned</span>
              )}
            </div>
          </div>
          <button
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-gray-500 text-gray-100/60 hover:border-green-500 hover:text-green-500 hover:bg-green-500/10 transition-colors duration-150"
            type="button"
            onClick={() => handleAddAsset(item.id)}
            aria-label="Add asset to staff"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
