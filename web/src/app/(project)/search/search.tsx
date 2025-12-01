import type { UserProps } from '@/app/interface/index'
import type { AssetList } from '@/app/types/index'
import { getAssetBySerial } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AddAsset } from '../../components/addAsset'
import { InputField, InputRoot } from '../../components/input'
import { SearchSchema } from '../../schemas/searchSchema'

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

  // Watch the serial number input value
  // This will trigger a re-render whenever the value changes
  const serialNumber = watch('serialNumber', '')

  async function searchAsset() {
    const { success, message, assetList } = await getAssetBySerial({
      serialNumber,
    })
    if (success) {
      setAssetFound(assetList)
      toast[success ? 'success' : 'error'](message)
    } else {
      toast.error(message)
      setAssetFound([])
    }
  }

  return (
    <div className="max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-200 rounded-lg">
      <span className="font-bold text-gray-50">Add new asset to staff:</span>
      {userRole === 'admin' ? (
        <>
          <form onSubmit={handleSubmit(searchAsset)}>
            <InputRoot data-error={!!errors.serialNumber} className="relative">
              <InputField
                onChange={e => {
                  setValue('serialNumber', e.target.value)
                }}
                type="text"
                placeholder="Search by Serial Number"
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-200 hover:text-green-500 hover:cursor-pointer focus:outline-none "
                tabIndex={0}
                aria-label="Search"
              >
                <Icons.Search size={18} />
              </button>
            </InputRoot>
            {errors.serialNumber && (
              <p className="ml-2 text-red text-xs font-semibold">
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
        <div className="text-red-500">
          <p className="text-sm">Contact manager to add asset.</p>
        </div>
      )}
    </div>
  )
}
