'use client'
import { AddLicence } from '@/features/assignments/components/addLicence'
import { LicenceSearchSchema } from '@/features/search/schemas/searchSchema'
import { getApiLicenceByNumberLicenceNumber } from '@/http/api'
import { InputField, InputRoot } from '@/shared/components/input'
import type { UserProps } from '@/shared/interface/index'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

type FoundLicence = {
  id: string
  name: string
  licenceNumber: string
  status: string
  assignedTo: string | null
}

export function SearchLicence({ staffEmail, userEmail, userRole }: UserProps) {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LicenceSearchSchema>({
    resolver: zodResolver(LicenceSearchSchema),
  })
  const [licenceFound, setLicenceFound] = useState<FoundLicence[]>([])

  async function searchLicence({ licenceNumber }: LicenceSearchSchema) {
    try {
      const { message, licenceDetails } =
        await getApiLicenceByNumberLicenceNumber(licenceNumber)
      setLicenceFound(
        licenceDetails.map(item => ({
          id: item.id,
          name: item.name,
          licenceNumber: item.licenceNumber,
          status: item.status,
          assignedTo: item.assignedTo,
        }))
      )
      toast.success(message)
    } catch (thrown) {
      const body = thrown as { error?: { message?: string } }
      toast.error(body?.error?.message ?? 'Licence not found')
      setLicenceFound([])
    }
  }

  return (
    <div className="self-start bg-gray-800 border border-gray-600 rounded-lg p-4">
      <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
        <Icons.Search className="w-3.5 h-3.5" />
        Add Licence to Staff
      </h3>
      {userRole === 'admin' ? (
        <>
          <form onSubmit={handleSubmit(searchLicence)}>
            <InputRoot data-error={!!errors.licenceNumber} className="relative">
              <InputField
                onChange={e => setValue('licenceNumber', e.target.value)}
                type="text"
                placeholder="Search by Licence Number (LIC-XXXX)"
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
            {errors.licenceNumber && (
              <p className="ml-2 mt-1 text-red text-xs font-semibold">
                {errors.licenceNumber.message}
              </p>
            )}
          </form>
          <AddLicence
            staffEmail={staffEmail}
            userEmail={userEmail}
            userRole={userRole}
            licence={licenceFound}
          />
        </>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          Contact admin to add licences.
        </p>
      )}
    </div>
  )
}
