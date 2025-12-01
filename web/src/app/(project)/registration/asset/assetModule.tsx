'use client'
import { normalizeAssetData } from '@/app/actions/normalizeAssetData'
import type { UserProps } from '@/app/interface/index'
import { postNewAsset } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Button } from '../../../components/button'
import { InputField, InputIcon, InputRoot } from '../../../components/input'
import { type AssetSchemaType, assetSchema } from '../../../schemas/assetSchema'

export function AssetModule({ userEmail, userRole, staffEmail }: UserProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssetSchemaType>({
    resolver: zodResolver(assetSchema),
  })

  async function assetRegister({
    serialNumber,
    name,
    type,
    maker,
    assignedTo,
    datePurchased,
    assetNumber,
  }: AssetSchemaType) {
    const normalizedData = normalizeAssetData({
      serialNumber,
      name,
      type,
      maker,
      assignedTo,
      datePurchased,
      assetNumber,
      createdBy: userEmail,
    })

    const { success, message, staff } = await postNewAsset(normalizedData)
    toast[success ? 'success' : 'error'](message)
    if (staff) {
      toast.info(`Staff: ${staff}`)
    }
    await router.push('/registration')
    reset()
  }

  return (
    <div className="max-w-md w-full max-h-fit bg-gray-800 p-6 rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Asset</h1>
      <form
        onSubmit={handleSubmit(assetRegister)}
        className="flex flex-col gap-4"
      >
        {/* Serial Number */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.serialNumber}>
            <InputIcon>
              <Icons.Barcode />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Serial Number"
              {...register('serialNumber')}
            />
          </InputRoot>
          {errors.serialNumber && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.serialNumber.message}
            </p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.name}>
            <InputIcon>
              <Icons.ClipboardPen />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Asset Name"
              {...register('name')}
            />
          </InputRoot>
          {errors.name && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.type}>
            <InputIcon>
              <Icons.Laptop />
            </InputIcon>
            <InputField type="text" placeholder="Type" {...register('type')} />
          </InputRoot>
          {errors.type && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Maker */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.maker}>
            <InputIcon>
              <Icons.LaptopMinimalCheck />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Maker"
              {...register('maker')}
            />
          </InputRoot>
          {errors.maker && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.maker.message}
            </p>
          )}
        </div>

        {/* Assigned To */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.assignedTo}>
            <InputIcon>
              <Icons.UserCheck />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Assigned To"
              {...register('assignedTo')}
            />
          </InputRoot>
          {errors.assignedTo && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.assignedTo.message}
            </p>
          )}
        </div>

        {/* Date Bought */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.datePurchased}>
            <InputIcon>
              <Icons.CalendarDays />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Date of Purchase"
              {...register('datePurchased')}
            />
          </InputRoot>
          {errors.datePurchased && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.datePurchased.message}
            </p>
          )}
        </div>

        {/* Asset Number */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.assetNumber}>
            <InputIcon>
              <Icons.FileDigit />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Asset Number"
              {...register('assetNumber')}
            />
          </InputRoot>
          {errors.assetNumber && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.assetNumber.message}
            </p>
          )}
        </div>
        <Button type="submit">
          Register Asset
          <Icons.Check />
        </Button>
      </form>
    </div>
  )
}
