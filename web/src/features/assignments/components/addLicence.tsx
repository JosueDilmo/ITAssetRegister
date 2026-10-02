'use client'
import {
  type PostApiLicenceToStaffEmail200,
  type PostApiLicenceToStaffEmail409,
  postApiLicenceToStaffEmail,
} from '@/http/api'
import type { UserProps } from '@/shared/interface/index'
import { reloadAfterToast } from '@/shared/lib/reloadAfterToast'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'

type LicenceList = Array<{
  id: string
  name: string
  licenceNumber: string
  status: string
  assignedTo: string | null
}>

const NOT_ASSIGNABLE_STATUSES = ['RETIRED', 'EXPIRED']

export function AddLicence({
  staffEmail,
  userEmail,
  userRole,
  licence,
}: UserProps & { licence: LicenceList }) {
  if (userRole !== 'admin' || licence.length === 0) return null

  async function handleAddLicence(id: string) {
    try {
      const response = await postApiLicenceToStaffEmail(staffEmail, {
        licenceId: id,
        updatedBy: userEmail,
      })
      toast.success((response as PostApiLicenceToStaffEmail200).message)
      reloadAfterToast()
    } catch (thrown) {
      const conflict = thrown as PostApiLicenceToStaffEmail409
      const message = conflict?.error?.message ?? 'An error occurred'
      if (conflict?.error?.code === 'CONFLICT_ERROR') {
        const confirmRetry = window.confirm(message)
        if (confirmRetry) {
          try {
            const retryResponse = await postApiLicenceToStaffEmail(staffEmail, {
              licenceId: id,
              updatedBy: userEmail,
              userConfirmed: true,
            })
            toast.success(
              (retryResponse as PostApiLicenceToStaffEmail200).message
            )
          } catch (retryThrown) {
            const retryErr = retryThrown as PostApiLicenceToStaffEmail409
            toast.error(retryErr?.error?.message ?? 'Failed to assign licence')
          }
          reloadAfterToast()
        }
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5 mt-3">
      {licence.map(item => {
        const notAssignable = NOT_ASSIGNABLE_STATUSES.includes(item.status)
        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md hover:border-blue/50 transition-colors duration-150 border-l-2 ${
              item.status === 'ACTIVE' ? 'border-l-green-500' : 'border-l-red'
            }`}
          >
            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/manager/${item.id}`}
                  className="text-sm text-blue hover:underline font-medium truncate"
                >
                  {item.name}
                </Link>
                <span className="font-mono text-xs text-gray-100/60 shrink-0">
                  {item.licenceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {notAssignable ? (
                  <span className="text-xs font-mono uppercase text-red">
                    {item.status} - cannot be assigned
                  </span>
                ) : item.assignedTo ? (
                  <span className="flex items-center gap-1 text-xs font-mono text-orange-500 truncate">
                    <Icons.AlertTriangle className="w-3 h-3 shrink-0" />
                    {item.assignedTo}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-gray-100/30 italic">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
            <button
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-gray-500 text-gray-100/60 hover:border-green-500 hover:text-green-500 hover:bg-green-500/10 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-500 disabled:hover:text-gray-100/60 disabled:hover:bg-transparent"
              type="button"
              disabled={notAssignable}
              title={
                notAssignable
                  ? `${item.status} licences cannot be assigned`
                  : undefined
              }
              onClick={() => handleAddLicence(item.id)}
              aria-label="Add licence to staff"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
