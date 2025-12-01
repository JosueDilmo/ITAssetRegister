'use client'
import type { AssetInfoProps, UserProps } from '@/app/interface/index'
import {
  type AssetDetailsParams,
  AssetDetailsSchema,
} from '@/app/schemas/assetSchema'
import { patchAssetDetailsId } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Button } from '../../../../components/button'
import { InputField, InputRoot } from '../../../../components/input'

export function EditAssetInfo({
  data,
  userEmail,
  userRole,
}: AssetInfoProps & UserProps) {
  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<AssetDetailsParams>({
    resolver: zodResolver(AssetDetailsSchema),
  })

  // State to manage the current note
  const [noteRegistered] = useState<string | null>(data[0].note)

  // Initialize status with the current value
  useEffect(() => {
    setValue('status', data[0].status) // Initialize status with the current value
  }, [data, setValue])

  // Get the current status value
  const status = watch('status', data[0].status)

  // Function to handle status change
  const handleStatusChange = () => {
    const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setValue('status', newStatus)
    console.log(newStatus)
  }

  const newNote = watch('note')

  // Function to update asset details
  async function updateAssetInfo({ status, note }: AssetDetailsParams) {
    const id = data[0].id
    const normalizedDetails = {
      status: status.toUpperCase(),
      note: !note || note === '' ? null : note.trim(),
    }

    // Update the asset details
    const { success: successDetails, message: messageDetails } =
      await patchAssetDetailsId(id, {
        status: normalizedDetails.status,
        note: normalizedDetails.note,
        updatedBy: userEmail,
      })

    await new Promise<void>(resolve => {
      toast[successDetails ? 'success' : 'error'](messageDetails)
      resolve()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 rounded-xl">
      {data.map(item => (
        <div
          key={item.id}
          className="max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-200 rounded-lg mb-4"
        >
          <h5 className="text-2xl font-bold tracking-tight text-gray-50">
            {item.name}
          </h5>
          <form className="mb-2" onSubmit={handleSubmit(updateAssetInfo)}>
            <span className="font-bold text-gray-50">Status:</span>{' '}
            {userRole === 'admin' ? (
              getValues('status') === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange()}
                  className="bg-orange-900 text-gray-50 hover:bg-orange-500 hover:text-gray-900 hover:cursor-pointer p-2 rounded-xl"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange()}
                  className="bg-green-900 text-gray-50 hover:bg-green-500 hover:text-gray-800 hover:cursor-pointer p-2 rounded-xl"
                >
                  Activate
                </button>
              )
            ) : (
              <span className="text-gray-300 ml-2">
                {status.toUpperCase()}{' '}
              </span>
            )}
            {userRole === 'admin' ? (
              <>
                <p className="font-bold text-gray-50">
                  Note:{' '}
                  <span className="font-normal text-gray-100">
                    {newNote ? newNote : noteRegistered}
                  </span>
                </p>
                <InputRoot className="mb-2" data-error={!!errors.note}>
                  <InputField
                    type="text"
                    placeholder={'add new note'}
                    onChange={e => {
                      const value = e.target.value.trim()
                      if (value) {
                        setValue('note', value)
                      } else {
                        setValue('note', noteRegistered)
                      }
                    }}
                  />
                </InputRoot>
                {errors.note && (
                  <p className="ml-2 text-red text-xs font-semibold">
                    {errors.note.message}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 font-bold text-gray-50">
                Note:{' '}
                <span className="font-normal text-gray-100">
                  {newNote ? newNote : noteRegistered}
                </span>
              </p>
            )}
            <p className="mb-2 mt-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50 ">Serial Number:</span>{' '}
              {item.serialNumber}
            </p>
            <p className="mb-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Type:</span> {item.type}
            </p>
            <p className="font-bold text-gray-50">
              Assigned To:{' '}
              <span className="font-normal text-gray-100">
                {item.assignedTo}
              </span>
            </p>
            <p className="mb-2 mt-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Date Purchased:</span>{' '}
              {new Date(item.datePurchased).toDateString()}
            </p>
            <p className="mb-2 mt-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Date Assigned:</span>{' '}
              {item.dateAssigned
                ? new Date(item.dateAssigned).toDateString()
                : 'N/A'}
            </p>
            <p className="mb-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Asset Number:</span>{' '}
              {item.assetNumber}
            </p>
            {userRole === 'admin' ? (
              <Button type="submit">Save Changes</Button>
            ) : (
              <span />
            )}
          </form>
        </div>
      ))}
    </div>
  )
}
