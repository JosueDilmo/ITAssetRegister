'use client'

import { InputField, InputRoot } from '@/app/components/input'
import type { StaffList } from '@/app/types'
import { type GetAllStaffOrderBy, getAllStaff } from '@/http/api'
import * as Icons from 'lucide-react'
import { useEffect, useState } from 'react'
import { BoxField, BoxIcon, BoxRoot } from '../../../../components/box'
import { Button } from '../../../../components/button'

export function DisplayAllStaff() {
  const [search, setSearch] = useState<string>('')
  const [pageValue, setPageValue] = useState<number>(1)
  const [pageTotal, setPageTotal] = useState<number>(1)
  const [queryAll, setQueryAll] = useState<StaffList>([])

  // Get the current values of the form fields
  const handleOrderByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.target.value as GetAllStaffOrderBy
  }

  useEffect(() => {
    getAllStaff({ search: search, page: pageValue }).then(data => {
      setQueryAll(data.staffList)
      setPageTotal(data.totalPages)
    })
  }, [search, pageValue])

  return (
    <div className="w-full h-dvh grid grid-cols-2 gap-4 p-6 ml-4 rounded-xl overflow-hidden scrollbar-hide overflow-y-auto">
      <InputRoot className="" data-error={false}>
        <InputField
          type="text"
          placeholder={'Search'}
          onChange={e => {
            const value = e.target.value.trim()
            if (value) {
              setSearch(value)
            } else {
              setSearch('')
            }
          }}
        />
      </InputRoot>
      <select
        className="mr-8 p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-50"
        onChange={handleOrderByChange}
      >
        <option value="name">Name</option>
        <option value="department">Department</option>
        <option value="email">Email</option>
        <option value="createdAt">Created At</option>
      </select>
      <span className="text-gray-50 mr-4">Page:</span>
      <select
        className="ml-4 p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-50"
        onChange={e => setPageValue(Number(e.target.value))}
      >
        {Array.from({ length: pageTotal }, (_, i) => i + 1).map(pageNum => (
          <option key={pageNum} value={pageNum}>
            {pageNum}
          </option>
        ))}
      </select>
      {queryAll.map(staff => (
        <div
          key={staff.id}
          className="max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-200 rounded-lg"
        >
          <BoxRoot className="" data-error={staff.status === 'INACTIVE'}>
            <BoxField> {staff.status.toUpperCase()} </BoxField>
            <BoxIcon>
              {staff.status === 'INACTIVE' ? <Icons.X /> : <Icons.Activity />}
            </BoxIcon>
          </BoxRoot>
          <h5 className="text-2xl font-bold tracking-tight text-gray-50">
            {staff.name}
          </h5>
          <p className="mb-2 font-normal text-gray-100 overflow-x-auto overflow-hidden scrollbar-hide ">
            {staff.email}
          </p>
          <Button className="bg-gray-900" routeId={staff.id}>
            Manage
            <Icons.SquareArrowUpRight />
          </Button>
        </div>
      ))}
    </div>
  )
}
