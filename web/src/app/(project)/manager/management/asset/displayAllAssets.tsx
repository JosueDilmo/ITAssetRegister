import { getAllAssets } from '@/http/api'
import * as Icons from 'lucide-react'
import { BoxField, BoxIcon, BoxRoot } from '../../../../components/box'
import { Button } from '../../../../components/button'

export async function DisplayAllAssets() {
  const data = await getAllAssets()

  return (
    <div className="w-full h-dvh grid grid-cols-2 gap-4 p-6 ml-4 rounded-xl overflow-hidden scrollbar-hide overflow-y-auto">
      {data?.assetList?.map(asset => (
        <div
          key={asset.id}
          className="max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-200 rounded-lg"
        >
          <BoxRoot className="" data-error={asset.status === 'INACTIVE'}>
            <BoxField> {asset.status.toUpperCase()} </BoxField>
            <BoxIcon>
              {asset.status === 'INACTIVE' ? <Icons.X /> : <Icons.Activity />}
            </BoxIcon>
          </BoxRoot>
          <h5 className="text-2xl font-bold tracking-tight text-gray-50">
            {asset.name}
          </h5>
          <p className="mb-2 font-normal text-gray-100 overflow-hidden overflow-x-auto scrollbar-hide">
            {asset.serialNumber}
          </p>

          <Button className="bg-gray-900" routeId={asset.id}>
            Manage
            <Icons.SquareArrowUpRight />
          </Button>
        </div>
      ))}
      {(!data?.assetList || data.assetList.length === 0) && (
        <div className="col-span-2 text-center text-gray-400 text-lg mt-10">
          No assets found.
        </div>
      )}
    </div>
  )
}
