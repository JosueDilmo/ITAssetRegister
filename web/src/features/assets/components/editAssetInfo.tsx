'use client'
import type { AssetInfoProps, UserProps } from '@/shared/interface/index'
import {
  ASSET_CONDITION,
  ASSET_STATUS,
  type AssetDetailsParams,
  AssetDetailsSchema,
} from '@/features/assets/schemas/assetSchema'
import { ChangeLogTable } from '@/features/manager/components/ChangeLogTable'
import {
  patchApiAssetDetailsId,
  type PatchApiAssetDetailsIdBodyStatus,
  type PatchApiAssetDetailsIdBodyCondition,
} from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Button } from '@/shared/components/button'
import { InputField, InputRoot } from '@/shared/components/input'

export function EditAssetInfo({
  data,
  userEmail,
  userRole,
}: AssetInfoProps & UserProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssetDetailsParams>({
    resolver: zodResolver(AssetDetailsSchema),
  })

  const [noteRegistered] = useState<string | null>(data[0].note)
  const [conditionRegistered] = useState<string>(data[0].condition)

  useEffect(() => {
    setValue('status', data[0].status as typeof ASSET_STATUS[number])
  }, [data, setValue])

  const status = watch('status', data[0].status as typeof ASSET_STATUS[number])
  const newNote = watch('note')
  const newCondition = watch('condition')

  const handleStatusChange = () => {
    setValue('status', status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
  }

  async function updateAssetInfo({ status, condition, note }: AssetDetailsParams) {
    const id = data[0].id
    const { success, message } = await patchApiAssetDetailsId(id, {
      status: status.toUpperCase() as PatchApiAssetDetailsIdBodyStatus,
      note: !note || note === '' ? null : note.trim(),
      condition: (condition ?? '') as PatchApiAssetDetailsIdBodyCondition,
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

          {/* Asset info card */}
          <div className={`bg-gray-600 border border-gray-500 rounded-lg overflow-hidden border-l-2 ${
            status === 'ACTIVE' ? 'border-l-green-500' : 'border-l-red'
          }`}>
            {/* Status bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-500 bg-gray-700/80">
              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                status === 'ACTIVE' ? 'bg-green-500 animate-status-dot' : 'bg-red'
              }`} />
              <span className="text-xs font-mono uppercase tracking-widest text-gray-50">
                {status}
              </span>
              <span className="ml-auto font-mono text-xs text-gray-100/25">{item.id.slice(0, 8)}</span>
            </div>

            <div className="px-5 py-5">
              <h2 className="text-xl font-heading font-bold text-gray-50 mb-5 tracking-tight">
                {item.name}
              </h2>

              {/* Data rows */}
              <div className="flex flex-col divide-y divide-gray-500/50 mb-4">
                {[
                  { label: 'Serial', value: item.serialNumber, mono: true },
                  { label: 'Asset#', value: item.assetNumber, mono: true },
                  { label: 'Maker', value: item.maker, mono: false },
                  { label: 'Type', value: item.type, mono: false },
                  { label: 'Cond', value: newCondition || conditionRegistered, mono: true },
                  {
                    label: 'Owner',
                    value: item.assignedTo || '—',
                    mono: true,
                    muted: !item.assignedTo,
                  },
                  {
                    label: 'Bought',
                    value: new Date(item.datePurchased).toLocaleDateString('en-IE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }),
                    mono: true,
                  },
                  {
                    label: 'Assigned',
                    value: item.dateAssigned
                      ? new Date(item.dateAssigned).toLocaleDateString('en-IE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
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
                    <span className={`text-sm break-all flex-1 ${
                      row.mono ? 'font-mono text-gray-100' : 'text-gray-50'
                    } ${row.muted ? 'text-gray-100/25 italic' : ''}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {userRole === 'admin' && (
                <form
                  onSubmit={handleSubmit(updateAssetInfo)}
                  className="flex flex-col gap-3 border-t border-gray-500 pt-4"
                >
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-500 px-3 py-2">
                    <Icons.ListCheck className="w-4 h-4 text-gray-100/60 shrink-0" />
                    <select
                      className="flex-1 bg-transparent text-sm text-gray-100 outline-none"
                      value={newCondition || conditionRegistered}
                      onChange={e => setValue('condition', e.target.value as typeof ASSET_CONDITION[number])}
                    >
                      {ASSET_CONDITION.map(c => (
                        <option className="bg-gray-800 text-gray-100" key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

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
                        <><Icons.PackageX className="w-3.5 h-3.5" /> Deactivate</>
                      ) : (
                        <><Icons.PackageCheck className="w-3.5 h-3.5" /> Activate</>
                      )}
                    </button>

                    <Button type="submit" disabled={isSubmitting} className="flex-1 h-10 text-sm">
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

              {userRole === 'viewer' && (
                <div className="border-t border-gray-500 mt-4 pt-3">
                  <span className="text-xs font-mono text-gray-100/30 uppercase tracking-wider">read-only</span>
                </div>
              )}
            </div>
          </div>

          {/* Change history — side by side */}
          <ChangeLogTable
            changeLog={item.changeLog ?? []}
            title="Asset Change History"
          />
        </div>
      ))}
    </div>
  )
}
