'use client'
import { Search } from '@/features/search/components/search'
import { Button } from '@/shared/components/button'
import type { StaffInfoProps, UserProps } from '@/shared/interface/index'
import { ChangeLogTable } from '@/features/manager/components/ChangeLogTable'
import {
  STAFF_STATUS,
  type StaffDetailsParams,
  StaffDetailsSchema,
} from '@/features/staff/schemas/staffSchema'
import { patchApiStaffDetailsId } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { InputField, InputRoot } from '@/shared/components/input'
import { EditStaffAssetList } from './editStaffAssetList'

export function EditStaffInfo({
  data,
  userEmail,
  userRole,
}: StaffInfoProps & UserProps) {
  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StaffDetailsParams>({
    resolver: zodResolver(StaffDetailsSchema),
  })

  const status = watch('status', data[0].status as typeof STAFF_STATUS[number])

  useEffect(() => {
    setValue('status', data[0].status as typeof STAFF_STATUS[number])
  }, [data, setValue])

  const [staffEmail] = useState<string>(data[0].email)
  const [noteRegistered] = useState<string | null>(data[0].note)
  const newNote = watch('note')

  const handleStatusChange = () => {
    setValue('status', status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
  }

  async function manageStaffInfo({ status, note }: StaffDetailsParams) {
    const normalizedData = {
      status: status.toUpperCase(),
      note: !note || note === '' ? null : note.trim(),
      updatedBy: userEmail,
    }
    const id = data[0].id
    const { success, message } = await patchApiStaffDetailsId(id, normalizedData)
    await new Promise<void>(resolve => {
      toast[success ? 'success' : 'error'](message)
      resolve()
    })
  }

  return (
    <div className="grid grid-cols-3 gap-6 w-full h-full p-4 rounded-xl">
      {data.map(item => (
        <div key={item.id} className="flex flex-col gap-4">

          {/* Profile card */}
          <div className={`bg-gray-800 border border-gray-600 rounded-lg overflow-hidden border-l-2 ${
            status === 'ACTIVE' ? 'border-l-green-500' : 'border-l-red'
          }`}>
            {/* Status bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-700 bg-gray-800/80">
              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                status === 'ACTIVE' ? 'bg-green-500 animate-status-dot' : 'bg-red'
              }`} />
              <span className="text-xs font-mono uppercase tracking-widest text-gray-300">
                {status}
              </span>
              <span className="ml-auto font-mono text-xs text-gray-600">{item.id.slice(0, 8)}</span>
            </div>

            <div className="px-5 py-5">
              <h2 className="text-xl font-heading font-bold text-gray-50 mb-5 tracking-tight">
                {item.name}
              </h2>

              {/* Data rows */}
              <div className="flex flex-col divide-y divide-gray-700/50">
                {[
                  { label: 'Email', value: item.email, mono: true },
                  { label: 'Dept', value: item.department, mono: false },
                  { label: 'Title', value: item.jobTitle, mono: false },
                  {
                    label: 'Since',
                    value: new Date(item.createdAt).toLocaleDateString('en-IE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }),
                    mono: true,
                  },
                  {
                    label: 'Note',
                    value: (newNote ?? noteRegistered) || '—',
                    mono: false,
                    muted: !(newNote ?? noteRegistered),
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 py-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-gray-500 w-10 shrink-0 pt-0.5">
                      {row.label}
                    </span>
                    <span className={`text-sm break-all ${row.mono ? 'font-mono text-gray-300' : 'text-gray-200'} ${row.muted ? 'text-gray-600 italic' : ''}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {userRole === 'admin' && (
                <form
                  onSubmit={handleSubmit(manageStaffInfo)}
                  className="flex flex-col gap-3 border-t border-gray-700 mt-4 pt-4"
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
                        <><Icons.UserX className="w-3.5 h-3.5" /> Deactivate</>
                      ) : (
                        <><Icons.UserCheck className="w-3.5 h-3.5" /> Activate</>
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
                <div className="border-t border-gray-700 mt-4 pt-3">
                  <span className="text-xs font-mono text-gray-600 uppercase tracking-wider">read-only</span>
                </div>
              )}
            </div>
          </div>

          {/* Asset assignment history */}
          {item.assetHistoryList && item.assetHistoryList.filter(Boolean).length > 0 && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Icons.History className="w-3.5 h-3.5" />
                Asset History
                <span className="ml-auto text-gray-600">
                  {item.assetHistoryList.filter(Boolean).length}
                </span>
              </h3>
              <div className="flex flex-col gap-1 max-h-44 overflow-y-auto scrollbar-hide">
                {item.assetHistoryList.filter(Boolean).map((assetId, i) => (
                  <a
                    key={i}
                    href={`/manager/${assetId}`}
                    className="group flex items-center gap-2 px-2.5 py-1.5 rounded bg-gray-700 border border-gray-600 hover:border-blue/50 transition-colors duration-150"
                  >
                    <Icons.Package className="w-3 h-3 text-gray-500 group-hover:text-blue shrink-0 transition-colors" />
                    <span className="font-mono text-xs text-gray-400 group-hover:text-blue transition-colors flex-1">
                      {assetId}
                    </span>
                    <Icons.ArrowUpRight className="w-3 h-3 text-gray-600 group-hover:text-blue shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <EditStaffAssetList
        staffEmail={staffEmail}
        userEmail={userEmail}
        userRole={userRole}
      />
      <Search
        staffEmail={staffEmail}
        userEmail={userEmail}
        userRole={userRole}
      />

      <div className="col-span-3">
        <ChangeLogTable
          changeLog={data[0].changeLog ?? []}
          title="Staff Change History"
        />
      </div>
    </div>
  )
}
