'use client'
import {
  type LICENCE_STATUS,
  type LicenceDetailsParams,
  LicenceDetailsSchema,
} from '@/features/licences/schemas/licenceSchema'
import { ChangeLogTable } from '@/features/manager/components/ChangeLogTable'
import {
  type PatchApiLicenceDetailsIdBodyStatus,
  patchApiLicenceDetailsId,
} from '@/http/api'
import { Button } from '@/shared/components/button'
import { InputField, InputRoot } from '@/shared/components/input'
import type { LicenceInfoProps, UserProps } from '@/shared/interface/index'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

export function EditLicenceInfo({
  data,
  userEmail,
  userRole,
}: LicenceInfoProps & UserProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LicenceDetailsParams>({
    resolver: zodResolver(LicenceDetailsSchema),
  })

  const [noteRegistered] = useState<string | null>(data[0].note)

  useEffect(() => {
    setValue('status', data[0].status as (typeof LICENCE_STATUS)[number])
  }, [data, setValue])

  const status = watch(
    'status',
    data[0].status as (typeof LICENCE_STATUS)[number]
  )
  const newNote = watch('note')

  const handleStatusChange = () => {
    setValue('status', status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
  }

  async function updateLicenceInfo({ status, note }: LicenceDetailsParams) {
    const id = data[0].id
    const { success, message } = await patchApiLicenceDetailsId(id, {
      status: status.toUpperCase() as PatchApiLicenceDetailsIdBodyStatus,
      note: !note || note === '' ? null : note.trim(),
      updatedBy: userEmail,
    })
    await new Promise<void>(resolve => {
      toast[success ? 'success' : 'error'](message)
      resolve()
    })
  }

  return (
    <div className="w-full p-4">
      {data.map(item => (
        <div key={item.id} className="grid grid-cols-2 gap-6">
          <div
            className={`bg-gray-600 border border-gray-500 rounded-lg overflow-hidden border-l-2 ${
              status === 'ACTIVE' ? 'border-l-green-500' : 'border-l-red'
            }`}
          >
            {/* Status bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-500 bg-gray-700/80">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  status === 'ACTIVE'
                    ? 'bg-green-500 animate-status-dot'
                    : 'bg-red'
                }`}
              />
              <span className="text-xs font-mono uppercase tracking-widest text-gray-50">
                {status}
              </span>
              <span className="ml-auto font-mono text-xs text-gray-100/25">
                {item.id.slice(0, 8)}
              </span>
            </div>

            <div className="px-5 py-5">
              <h2 className="text-xl font-heading font-bold text-gray-50 mb-5 tracking-tight">
                {item.name}
              </h2>

              {/* Data rows */}
              <div className="flex flex-col divide-y divide-gray-500/50 mb-4">
                {[
                  { label: 'Licence#', value: item.licenceNumber, mono: true },
                  { label: 'Vendor', value: item.vendor, mono: false },
                  { label: 'Type', value: item.licenceType, mono: false },
                  {
                    label: 'Cost',
                    value: item.cost ? `€${item.cost}` : '—',
                    mono: true,
                    muted: !item.cost,
                  },
                  {
                    label: 'Owner',
                    value: item.assignedTo || '—',
                    mono: true,
                    muted: !item.assignedTo,
                  },
                  {
                    label: 'Bought',
                    value: new Date(item.datePurchased).toLocaleDateString(
                      'en-IE',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }
                    ),
                    mono: true,
                  },
                  {
                    label: 'Expires',
                    value: item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString('en-IE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—',
                    mono: true,
                    muted: !item.expiryDate,
                  },
                  {
                    label: 'Assigned',
                    value: item.dateAssigned
                      ? new Date(item.dateAssigned).toLocaleDateString(
                          'en-IE',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )
                      : '—',
                    mono: true,
                    muted: !item.dateAssigned,
                  },
                  {
                    label: 'Note',
                    value: (newNote ?? noteRegistered) || '—',
                    mono: false,
                    muted: !(newNote ?? noteRegistered),
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 py-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue/60 w-16 shrink-0 pt-0.5">
                      {row.label}
                    </span>
                    <span
                      className={`text-sm break-all flex-1 ${
                        row.mono ? 'font-mono text-gray-100' : 'text-gray-50'
                      } ${row.muted ? 'text-gray-100/25 italic' : ''}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {userRole === 'admin' && (
                <form
                  onSubmit={handleSubmit(updateLicenceInfo)}
                  className="flex flex-col gap-3 border-t border-gray-500 pt-4"
                >
                  <InputRoot data-error={!!errors.note} className="h-10">
                    <InputField
                      type="text"
                      placeholder="Update note…"
                      onChange={e => {
                        const value = e.target.value.trim()
                        if (value) {
                          setValue('note', value)
                        } else {
                          setValue('note', noteRegistered as string)
                        }
                      }}
                    />
                  </InputRoot>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleStatusChange}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors duration-150 ${
                        status === 'ACTIVE'
                          ? 'border-orange-500/40 text-orange-500 hover:bg-orange-500/10'
                          : 'border-green-500/40 text-green-500 hover:bg-green-500/10'
                      }`}
                    >
                      {status === 'ACTIVE' ? (
                        <>
                          <Icons.PackageX className="w-3.5 h-3.5" /> Deactivate
                        </>
                      ) : (
                        <>
                          <Icons.PackageCheck className="w-3.5 h-3.5" />{' '}
                          Activate
                        </>
                      )}
                    </button>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-10 text-sm"
                    >
                      {isSubmitting ? (
                        <Icons.Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        'Save'
                      )}
                      {!isSubmitting && <Icons.Check className="w-4 h-4" />}
                    </Button>
                  </div>
                </form>
              )}

              {userRole !== 'admin' && (
                <div className="border-t border-gray-500 mt-4 pt-3">
                  <span className="text-xs font-mono text-gray-100/30 uppercase tracking-wider">
                    read-only
                  </span>
                </div>
              )}
            </div>
          </div>

          <ChangeLogTable
            changeLog={item.changeLog ?? []}
            title="Licence Change History"
          />
        </div>
      ))}
    </div>
  )
}
