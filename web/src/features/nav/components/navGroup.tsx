'use client'

import { NavLink } from '@/features/nav/components/navLink'
import type { ModuleNavItem } from '@/shared/constants/modules'
import * as Icons from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const linkClass =
  'group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150'
const activeClass = 'border-l-blue text-blue bg-gray-700'

export function NavGroup({
  label,
  items,
}: { label: string; items: ModuleNavItem[] }) {
  const pathname = usePathname()
  const hasActiveChild = items.some(item => pathname.startsWith(item.href))
  const [open, setOpen] = useState(hasActiveChild)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span>{label}</span>
        <Icons.ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {items.map(item => (
            <NavLink
              key={item.href}
              href={item.href}
              className={linkClass}
              activeClassName={activeClass}
            >
              <span className="text-sm font-medium">{item.name}</span>
              <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
