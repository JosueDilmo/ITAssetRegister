'use client'
import {
  type DeleteApiLicenceById409,
  type GetApiLicencesByStaffEmail200,
  deleteApiLicenceById,
  getApiLicencesByStaffEmail,
} from '@/http/api'
import type { UserProps } from '@/shared/interface/index'
import { reloadAfterToast } from '@/shared/lib/reloadAfterToast'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

type ThrownBody = { error?: { code?: string; message?: string } }

export function EditStaffLicenceList({
  staffEmail,
  userEmail,
  userRole,
}: UserProps) {
  const [licenceList, setLicenceList] = useState<
    GetApiLicencesByStaffEmail200['licenceList'] | null
  >(null)

  useEffect(() => {
    async function getAllLicencesByEmail() {
      try {
        const { licenceList } = await getApiLicencesByStaffEmail(staffEmail)
        setLicenceList(licenceList)
      } catch (thrown) {
        const body = thrown as ThrownBody
        if (body?.error?.code === 'NOT_FOUND') {
          setLicenceList([])
          return
        }
        setLicenceList([])
        toast.error(body?.error?.message ?? 'Failed to load licences')
      }
    }
    getAllLicencesByEmail()
  }, [staffEmail])

  const handleRemoveLicence = async (id: string) => {
    const updatedBy = userEmail
    try {
      const response = await deleteApiLicenceById(id, {
        updatedBy,
        userConfirmed: false,
      })
      toast.success(response.message)
      reloadAfterToast()
    } catch (thrown) {
      const conflict = thrown as DeleteApiLicenceById409
      const message = conflict?.error?.message
      if (conflict?.error?.code !== 'CONFLICT_ERROR') {
        toast.error(message ?? 'An unexpected error occurred')
        return
      }
      const userConfirmation = window.confirm(message)
      if (userConfirmation) {
        try {
          const retryResponse = await deleteApiLicenceById(id, {
            updatedBy,
            userConfirmed: true,
          })
          toast.success(retryResponse.message)
        } catch (retryThrown) {
          const retryErr = retryThrown as DeleteApiLicenceById409
          toast.error(retryErr?.error?.message ?? 'An error occurred')
        }
        reloadAfterToast()
      }
    }
  }

  return (
    <div className="max-h-[436px] flex flex-col bg-gray-800 border border-gray-600 rounded-lg p-4">
      <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2 shrink-0">
        <Icons.KeyRound className="w-3.5 h-3.5" />
        Current Licence List
        {licenceList !== null && (
          <span className="ml-auto text-gray-600">{licenceList.length}</span>
        )}
      </h3>
      {licenceList !== null && licenceList.length > 0 ? (
        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-hide">
          {licenceList.map(licence => (
            <div
              key={licence.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md hover:border-blue/50 transition-colors duration-150"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <Link
                  href={`/manager/${licence.id}`}
                  className="text-sm text-blue hover:underline font-medium truncate"
                >
                  {licence.name}
                </Link>
                <span className="font-mono text-xs text-gray-500">
                  {licence.licenceNumber}
                </span>
              </div>
              {userRole === 'admin' && (
                <button
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-gray-600 text-gray-500 hover:border-red hover:text-red hover:bg-red/10 transition-colors duration-150"
                  type="button"
                  onClick={() => handleRemoveLicence(licence.id)}
                  aria-label="Remove licence from staff"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        licenceList !== null && (
          <p className="text-gray-600 text-sm">No licences assigned</p>
        )
      )}
    </div>
  )
}
