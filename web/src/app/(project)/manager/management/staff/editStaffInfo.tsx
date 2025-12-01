'use client'
import { Search } from '@/app/(project)/search/search'
import { Button } from '@/app/components/button'
import type { StaffInfoProps, UserProps } from '@/app/interface/index'
import {
  type StaffDetailsParams,
  StaffDetailsSchema,
} from '@/app/schemas/staffSchema'
import { patchStaffDetailsId } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { InputField, InputRoot } from '../../../../components/input'
import { EditStaffAssetList } from './editStaffAssetList'

/*TODO: Fix the note register/ set value to work properly
  - If note is empty, it is setting to null, but it should be set to as noteRegistered
  - Display ChangeLog for the staff - get changeLog
  */

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
    formState: { errors },
  } = useForm<StaffDetailsParams>({
    resolver: zodResolver(StaffDetailsSchema),
  })

  // Get the current status value
  const status = watch('status', data[0].status)

  // Initialize status/email with the staff current value
  useEffect(() => {
    setValue('status', data[0].status) // Initialize status with the current value
  }, [data, setValue])

  // State to manage the staff email
  const [staffEmail] = useState<string>(data[0].email)

  // State to manage the current note being edited
  const [noteRegistered] = useState<string | null>(data[0].note)

  // Get the current note value
  const newNote = watch('note')

  // Function to handle status change
  const handleStatusChange = () => {
    const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setValue('status', newStatus)
    console.log(newStatus)
  }

  // Function to manage staff status and annotation
  async function manageStaffInfo({ status, note }: StaffDetailsParams) {
    const normalizedData = {
      status: status.toUpperCase(),
      note: !note || note === '' ? null : note.trim(),
      updatedBy: userEmail,
    }
    const id = data[0].id
    const { success, message } = await patchStaffDetailsId(id, normalizedData)
    await new Promise<void>(resolve => {
      toast[success ? 'success' : 'error'](message)
      resolve()
    })
  }

  return (
    <div className="grid grid-cols-3 gap-8 w-full h-full p-4 rounded-xl">
      {data.map(item => (
        <div
          key={item.id}
          className="max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-200 rounded-lg mb-4"
        >
          <h5 className="text-2xl font-bold tracking-tight text-gray-50">
            {item.name}
          </h5>
          <form onSubmit={handleSubmit(manageStaffInfo)}>
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
              <span className="font-bold text-gray-50">Email:</span>{' '}
              {item.email}
            </p>
            <p className="mb-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Department:</span>{' '}
              {item.department}
            </p>
            <p className="mb-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Job Title:</span>{' '}
              {item.jobTitle}
            </p>
            <p className="mb-2 font-normal text-gray-100">
              <span className="font-bold text-gray-50">Created At:</span>{' '}
              {new Date(item.createdAt).toDateString()}
            </p>
            {userRole === 'viewer' ? (
              <p className=""> </p>
            ) : (
              <Button type="submit">Save Changes</Button>
            )}
          </form>
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
    </div>
  )
}
