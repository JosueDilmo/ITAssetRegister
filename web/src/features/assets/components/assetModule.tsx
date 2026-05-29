'use client'
import { normalizeAssetData } from '@/features/assets/actions/normalizeAssetData'
import type { UserProps } from '@/shared/interface/index'
import { postApiNewAsset } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Button } from '@/shared/components/button'
import { InputField, InputIcon, InputRoot } from '@/shared/components/input'
import {
  ASSET_CONDITION,
  type AssetSchemaType,
  assetSchema,
} from '@/features/assets/schemas/assetSchema'

export function AssetModule({ userEmail, userRole, staffEmail }: UserProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AssetSchemaType>({
    resolver: zodResolver(assetSchema),
  })

  async function assetRegister({
    serialNumber,
    name,
    type,
    maker,
    condition,
    assignedTo,
    datePurchased,
    assetNumber,
  }: AssetSchemaType) {
    const normalizedData = normalizeAssetData({
      serialNumber,
      name,
      type,
      maker,
      condition,
      assignedTo,
      datePurchased,
      assetNumber,
      createdBy: userEmail,
    })

    const { result } = await postApiNewAsset(normalizedData)
    toast[result.success ? 'success' : 'error'](result.message)
    if (result.staff) {
      toast.info(`Staff: ${result.staff}`)
    }
    await router.push('/registration')
    reset()
  }

  return (
    <div className="max-w-md w-full max-h-fit bg-gray-600 p-6 rounded-xl">
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

        {/* Condition */}
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-200 px-4 py-3"
            data-error={!!errors.condition}
          >
            <Icons.ListCheck className="text-gray-100/60" />
            <select
              className="w-full bg-transparent text-sm text-gray-100 outline-none"
              defaultValue=""
              {...register('condition')}
            >
              <option className="bg-gray-200 text-gray-100" value="" disabled>
                Select Condition
              </option>
              {ASSET_CONDITION.map(c => (
                <option className="bg-gray-200 text-gray-100" key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {errors.condition && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.condition.message}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Asset'}
          {isSubmitting ? (
            <Icons.Loader2 className="animate-spin" />
          ) : (
            <Icons.Check />
          )}
        </Button>
      </form>
    </div>
  )
}
