'use client'
import { normalizeLicenceData } from '@/features/licences/actions/normalizeLicenceData'
import {
  LICENCE_TYPE,
  type LicenceSchemaType,
  licenceSchema,
} from '@/features/licences/schemas/licenceSchema'
import { type PostApiNewLicence409, postApiNewLicence } from '@/http/api'
import { Button } from '@/shared/components/button'
import { InputField, InputIcon, InputRoot } from '@/shared/components/input'
import type { UserProps } from '@/shared/interface/index'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

export function LicenceModule({ userEmail }: UserProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LicenceSchemaType>({ resolver: zodResolver(licenceSchema) })

  async function licenceRegister(values: LicenceSchemaType) {
    const normalizedData = normalizeLicenceData({
      ...values,
      createdBy: userEmail,
    })
    try {
      const { result } = await postApiNewLicence(normalizedData)
      toast[result.success ? 'success' : 'error'](result.message)
      if (result.staff) {
        toast.info(`Staff: ${result.staff}`)
      }
      await router.push('/registration/licence')
      reset()
    } catch (thrown) {
      const failure = thrown as PostApiNewLicence409
      toast.error(failure?.error?.message ?? 'Failed to register licence')
    }
  }

  return (
    <div className="max-w-md w-full max-h-fit bg-gray-600 p-6 rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Licence</h1>
      <form
        onSubmit={handleSubmit(licenceRegister)}
        className="flex flex-col gap-4"
      >
        {/* Name */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.name}>
            <InputIcon>
              <Icons.ClipboardPen />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Licence Name"
              {...register('name')}
            />
          </InputRoot>
          {errors.name && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Vendor */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.vendor}>
            <InputIcon>
              <Icons.Building2 />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Vendor"
              {...register('vendor')}
            />
          </InputRoot>
          {errors.vendor && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.vendor.message}
            </p>
          )}
        </div>

        {/* Licence Type */}
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-200 px-4 py-3"
            data-error={!!errors.licenceType}
          >
            <Icons.ListCheck className="text-gray-100/60" />
            <select
              className="w-full bg-transparent text-sm text-gray-100 outline-none"
              defaultValue=""
              {...register('licenceType')}
            >
              <option className="bg-gray-200 text-gray-100" value="" disabled>
                Select Licence Type
              </option>
              {LICENCE_TYPE.map(t => (
                <option className="bg-gray-200 text-gray-100" key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {errors.licenceType && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.licenceType.message}
            </p>
          )}
        </div>

        {/* Licence Key */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.licenceKey}>
            <InputIcon>
              <Icons.KeyRound />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Licence Key (optional)"
              {...register('licenceKey')}
            />
          </InputRoot>
          {errors.licenceKey && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.licenceKey.message}
            </p>
          )}
        </div>

        {/* Licence Number */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.licenceNumber}>
            <InputIcon>
              <Icons.FileDigit />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Licence Number (LIC-XXXX)"
              {...register('licenceNumber')}
            />
          </InputRoot>
          {errors.licenceNumber && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.licenceNumber.message}
            </p>
          )}
        </div>

        {/* Date Purchased */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.datePurchased}>
            <InputIcon>
              <Icons.CalendarDays />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Date of Purchase (yyyy-mm-dd)"
              {...register('datePurchased')}
            />
          </InputRoot>
          {errors.datePurchased && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.datePurchased.message}
            </p>
          )}
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.expiryDate}>
            <InputIcon>
              <Icons.CalendarX />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Expiry Date (optional, yyyy-mm-dd)"
              {...register('expiryDate')}
            />
          </InputRoot>
          {errors.expiryDate && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.expiryDate.message}
            </p>
          )}
        </div>

        {/* Cost */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.cost}>
            <InputIcon>
              <Icons.Euro />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Cost (optional)"
              {...register('cost')}
            />
          </InputRoot>
          {errors.cost && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.cost.message}
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
              placeholder="Assigned To (optional)"
              {...register('assignedTo')}
            />
          </InputRoot>
          {errors.assignedTo && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.assignedTo.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Licence'}
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
