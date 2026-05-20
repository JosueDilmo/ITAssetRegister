'use client'
import type { AssetProps, UserProps } from '@/shared/interface/index'
import { deleteApiAssetById, getApiAssetByStaffEmail, type DeleteApiAssetById409 } from '@/http/api'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export function EditStaffAssetList({
  staffEmail,
  userEmail,
  userRole,
}: UserProps) {
  const [getResult, setGetResult] = useState<AssetProps>()

  const handleRemoveAsset = async (id: string) => {
    const updatedBy = userEmail
    try {
      const response = await deleteApiAssetById(id, { updatedBy, userConfirmed: false })
      toast.success(response.message)
      window.location.reload()
    } catch (err) {
      const conflictErr = err as DeleteApiAssetById409
      const message = conflictErr?.error?.message
      if (!message) {
        toast.error('An unexpected error occurred')
        return
      }
      const userConfirmation = window.confirm(message)
      if (userConfirmation) {
        try {
          const retryResponse = await deleteApiAssetById(id, { updatedBy, userConfirmed: true })
          toast.success(retryResponse.message)
        } catch (retryErr) {
          const retryError = retryErr as DeleteApiAssetById409
          toast.error(retryError?.error?.message ?? 'An error occurred')
        }
        window.location.reload()
      }
    }
  }

  useEffect(() => {
    if (userRole !== 'admin') return
    async function getAllAssetByEmail() {
      const { success, message, assetList } = await getApiAssetByStaffEmail(staffEmail)
      setGetResult({ success, message, assetList })
    }
    getAllAssetByEmail()
  }, [staffEmail, userRole])

  if (userRole !== 'admin') return null

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
      <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
        <Icons.Package className="w-3.5 h-3.5" />
        Current Asset List
        {getResult?.success === true && (
          <span className="ml-auto text-gray-600">{getResult.assetList.length}</span>
        )}
      </h3>
      {getResult?.success === true && getResult.assetList.length > 0 ? (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
          {getResult.assetList.map((asset, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md hover:border-blue/50 transition-colors duration-150"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <Link
                  href={`/manager/${asset.id}`}
                  className="text-sm text-blue hover:underline font-medium truncate"
                >
                  {asset.name}
                </Link>
                <span className="font-mono text-xs text-gray-500">{asset.serialNumber}</span>
              </div>
              <button
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-gray-600 text-gray-500 hover:border-red hover:text-red hover:bg-red/10 transition-colors duration-150"
                type="button"
                onClick={() => handleRemoveAsset(asset.id)}
                aria-label="Remove asset"
              >
                <Icons.Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No asset assigned.</p>
      )}
    </div>
  )
}
