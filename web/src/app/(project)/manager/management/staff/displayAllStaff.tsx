import { getAllStaff } from '@/http/api'
import * as Icons from 'lucide-react'
import { BoxField, BoxIcon, BoxRoot } from '../../../../components/box'
import { Button } from '../../../../components/button'

export async function DisplayAllStaff() {
  const queryAll = await getAllStaff()

  return (
    <div className="w-full h-dvh grid grid-cols-2 gap-4 p-6 ml-4 rounded-xl overflow-hidden scrollbar-hide overflow-y-auto">
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
