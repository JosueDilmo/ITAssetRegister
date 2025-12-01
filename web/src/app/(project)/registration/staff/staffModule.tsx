'use client'
import { normalizeStaffData } from '@/app/actions/normalizeStaffData'
import type { UserProps } from '@/app/interface/index'
import { postNewStaff } from '@/http/api'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Button } from '../../../components/button'
import { InputField, InputIcon, InputRoot } from '../../../components/input'
import { type StaffSchemaType, staffSchema } from '../../../schemas/staffSchema'

export function StaffModule({ userEmail, userRole, staffEmail }: UserProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffSchemaType>({
    resolver: zodResolver(staffSchema),
  })

  async function staffRegister({
    name,
    email,
    department,
    jobTitle,
  }: StaffSchemaType) {
    const normalizedData = normalizeStaffData({
      name,
      email,
      department,
      jobTitle,
      createdBy: userEmail,
    })
    try {
      const { success, message, staff } = await postNewStaff(normalizedData)
      toast[success ? 'success' : 'error'](message)
      if (staff) {
        toast.info(`Staff: ${staff}`)
      }
      await router.push('/registration')
      reset()
    } catch (error) {
      console.error('An error occurred while registering the staff.')
    }
  }

  return (
    <div className="max-w-md w-full max-h-fit bg-gray-800 p-6 rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Staff</h1>
      <form
        onSubmit={handleSubmit(staffRegister)}
        className="flex flex-col gap-4"
      >
        {/* Name */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.name}>
            <InputIcon>
              <Icons.User />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Full name"
              {...register('name')}
            />
          </InputRoot>
          {errors.name && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.email}>
            <InputIcon>
              <Icons.Mail />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Email"
              {...register('email')}
            />
          </InputRoot>
          {errors.email && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Department */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.department}>
            <InputIcon>
              <Icons.Boxes />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Department"
              {...register('department')}
            />
          </InputRoot>
          {errors.department && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.department.message}
            </p>
          )}
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.jobTitle}>
            <InputIcon>
              <Icons.IdCard />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Job Title"
              {...register('jobTitle')}
            />
          </InputRoot>
          {errors.jobTitle && (
            <p className="ml-4 text-red text-xs font-semibold">
              {errors.jobTitle.message}
            </p>
          )}
        </div>

        <Button type="submit">
          Register Staff
          <Icons.Check />
        </Button>
      </form>
    </div>
  )
}
