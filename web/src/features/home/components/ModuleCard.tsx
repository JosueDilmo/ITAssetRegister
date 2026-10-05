import type { ModuleDef } from '@/shared/constants/modules'
import * as Icons from 'lucide-react'
import Link from 'next/link'

function getIcon(name: string): Icons.LucideIcon {
  const icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name]
  return icon ?? Icons.Box
}

export function ModuleCard({
  module,
  href,
}: {
  module: ModuleDef
  href?: string
}) {
  const Icon = getIcon(module.icon)
  const isLive = module.status === 'live'

  const card = (
    <div
      className={
        isLive
          ? 'flex flex-col gap-3 p-5 h-full rounded border border-gray-600 bg-gray-800 hover:border-blue hover:bg-gray-700 transition-all duration-150'
          : 'flex flex-col gap-3 p-5 h-full rounded border border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed select-none'
      }
    >
      <div className="flex items-center justify-between">
        <Icon
          className={isLive ? 'w-6 h-6 text-blue' : 'w-6 h-6 text-gray-500'}
        />
        {isLive ? (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-green-500 text-green-500 rounded">
            Live ●
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-gray-600 text-gray-500 rounded">
            Soon ○
          </span>
        )}
      </div>
      <h3 className="font-heading font-semibold uppercase tracking-wider text-sm text-gray-100">
        {module.name}
      </h3>
      <p className="text-xs text-gray-400">{module.description}</p>
    </div>
  )

  if (isLive) {
    return (
      <Link href={href ?? module.href} className="block h-full">
        {card}
      </Link>
    )
  }
  return card
}
