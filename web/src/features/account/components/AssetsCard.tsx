import type { getApiMe } from '@/http/api'
import * as Icons from 'lucide-react'

type MeAsset = Awaited<ReturnType<typeof getApiMe>>['assets'][number]

const DASH = '—'
const LOAD_ERROR =
  'We could not load your account details. Refresh the page to try again. If it keeps happening, contact IT support.'

export function AssetsCard({
  assets,
  failed,
}: {
  assets: MeAsset[]
  failed: boolean
}) {
  return (
    <section
      aria-labelledby="assets-title"
      className="rounded border border-gray-600 bg-gray-800 p-6"
    >
      <div className="flex items-center gap-2">
        <Icons.Laptop aria-hidden="true" className="w-4 h-4 text-gray-100" />
        <h2
          id="assets-title"
          className="font-heading text-sm font-semibold uppercase tracking-wider leading-tight text-gray-100"
        >
          Assets
        </h2>
        {!failed && (
          <span className="ml-auto font-mono text-xs text-gray-100">
            {assets.length}
          </span>
        )}
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-red">{LOAD_ERROR}</p>
      ) : assets.length === 0 ? (
        <p className="mt-4 py-2 text-sm text-gray-100">
          No assets assigned to you.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {assets.map(asset => {
            const makeAndModel = `${asset.maker} ${asset.name}`.trim()
            return (
              <div
                key={asset.id}
                className="rounded border border-gray-600 bg-gray-700 px-4 py-2 min-h-12 flex flex-col gap-1 md:flex-row md:items-center md:gap-4"
              >
                <span className="font-mono text-xs text-gray-50 shrink-0">
                  {asset.assetNumber || DASH}
                </span>
                <span className="text-sm text-gray-100">
                  {asset.type || DASH}
                </span>
                <span
                  title={makeAndModel}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-50"
                >
                  {makeAndModel || DASH}
                </span>
                <span className="font-mono text-xs text-gray-100 shrink-0 overflow-x-auto scrollbar-hide">
                  Serial: {asset.serialNumber || DASH}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
