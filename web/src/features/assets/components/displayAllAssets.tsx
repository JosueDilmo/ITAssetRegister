'use client'
import { InputField, InputRoot } from '@/shared/components/input'
import type { AssetList } from '@/shared/types'
import { type GetApiAllAssetsParams, getApiAllAssets } from '@/http/api'
import * as Icons from 'lucide-react'
import { useEffect, useState } from 'react'
import { BoxField, BoxIcon, BoxRoot } from '@/shared/components/box'
import { Button } from '@/shared/components/button'

export function DisplayAllAssets() {
  const [search, setSearch] = useState<string>('')
  const [data, setData] = useState<AssetList>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 25

  useEffect(() => {
    setIsLoading(true)
    getApiAllAssets({ search, page, limit } as GetApiAllAssetsParams)
      .then(res => {
        const paginated = res as unknown as { assetList: AssetList; total: number }
        setData(paginated.assetList)
        setTotal(paginated.total)
      })
      .finally(() => setIsLoading(false))
  }, [search, page])

  const totalPages = Math.ceil(total / limit)

  const filteredData = statusFilter
    ? data.filter(a => a.status === statusFilter)
    : data

  return (
    <div className="w-full h-dvh flex flex-col p-6 ml-4 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 pb-3 mb-1 border-b border-gray-700 shrink-0">
        <InputRoot className="flex-1" data-error={false}>
          <InputField
            type="text"
            placeholder={'Search by serial number...'}
            onChange={e => {
              setSearch(e.target.value.trim())
              setPage(1)
            }}
          />
        </InputRoot>
        <select
          className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue focus:outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option className="bg-gray-800 text-gray-100" value="">All Status</option>
          <option className="bg-gray-800 text-gray-100" value="ACTIVE">Active</option>
          <option className="bg-gray-800 text-gray-100" value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 overflow-y-auto scrollbar-hide flex-1 pt-3">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="max-w-sm p-6 bg-gray-700 border border-gray-600 rounded-lg animate-pulse"
              >
                <div className="h-6 w-20 bg-gray-600 rounded mb-3" />
                <div className="h-7 w-40 bg-gray-600 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-600 rounded mb-4" />
                <div className="h-9 w-24 bg-gray-600 rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            {filteredData.map(asset => (
              <div
                key={asset.id}
                className={`max-w-sm max-h-fit p-6 bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 hover:border-blue/50 hover:shadow-lg hover:shadow-blue/10 ${
                  asset.status === 'INACTIVE' ? 'border-l-2 border-l-red' : 'border-l-2 border-l-green-500'
                }`}
              >
                <BoxRoot className="" data-error={asset.status === 'INACTIVE'}>
                  <BoxIcon />
                  <BoxField>{asset.status.toUpperCase()}</BoxField>
                </BoxRoot>
                <h5 className="text-2xl font-bold tracking-tight text-gray-50 mb-1">
                  {asset.name}
                </h5>
                <p className="mb-3 font-mono text-sm text-gray-300 overflow-hidden overflow-x-auto scrollbar-hide">
                  {asset.serialNumber}
                </p>
                <Button className="bg-gray-900" routeId={asset.id}>
                  Manage
                  <Icons.SquareArrowUpRight />
                </Button>
              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="col-span-2 text-center text-gray-400 text-lg mt-10">
                No assets found.
              </div>
            )}
          </>
        )}

        {totalPages > 1 && (
          <div className="col-span-2 flex items-center justify-center gap-4 py-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-100 hover:border-blue hover:text-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <Icons.ChevronLeft className="inline h-4 w-4" /> Previous
            </button>
            <span className="text-sm font-mono text-gray-400">
              {page} / {totalPages} &nbsp;({total})
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-100 hover:border-blue hover:text-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Next <Icons.ChevronRight className="inline h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
