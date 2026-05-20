'use client'
import type { UserProps } from '@/shared/interface/index'
import type { AssetList } from '@/shared/types/index'
import { getApiAssetBySerialSerialNumber } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AddAsset } from '@/features/assignments/components/addAsset'
import { InputField, InputRoot } from '@/shared/components/input'
import { SearchSchema } from '@/features/search/schemas/searchSchema'

export function Search({ staffEmail, userEmail, userRole }: UserProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SearchSchema>({
    resolver: zodResolver(SearchSchema),
  })
  const [assetFound, setAssetFound] = useState<AssetList>([])
  const serialNumber = watch('serialNumber', '')

  async function searchAsset() {
    const { success, message, assetDetails } = await getApiAssetBySerialSerialNumber(serialNumber)
    if (success) {
      setAssetFound(assetDetails)
      toast.success(message)
    } else {
      toast.error(message)
      setAssetFound([])
    }
  }

  return (
    <div className="self-start bg-gray-800 border border-gray-600 rounded-lg p-4">
      <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
        <Icons.Search className="w-3.5 h-3.5" />
        Add Asset to Staff
      </h3>
      {userRole === 'admin' ? (
        <>
          <form onSubmit={handleSubmit(searchAsset)}>
            <InputRoot data-error={!!errors.serialNumber} className="relative">
              <InputField
                onChange={e => setValue('serialNumber', e.target.value)}
                type="text"
                placeholder="Search by Serial Number"
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue transition-colors focus:outline-none"
                tabIndex={0}
                aria-label="Search"
              >
                <Icons.Search size={16} />
              </button>
            </InputRoot>
            {errors.serialNumber && (
              <p className="ml-2 mt-1 text-red text-xs font-semibold">
                {errors.serialNumber.message}
              </p>
            )}
          </form>
          <AddAsset
            staffEmail={staffEmail}
            userEmail={userEmail}
            userRole={userRole}
            asset={assetFound}
          />
        </>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Contact admin to add assets.</p>
      )}
    </div>
  )
}
