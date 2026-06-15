import handleAuth from '@/features/auth/actions/handleAuth'
import { NavLink } from '@/features/nav/components/navLink'
import { visibleModules, visibleNavItems } from '@/shared/constants/modules'
import { auth } from '@/shared/lib/auth'
import * as Icons from 'lucide-react'
import { redirect } from 'next/navigation'
import { ToastContainer } from 'react-toastify'

const linkClass =
  'group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150'
const activeClass = 'border-l-blue text-blue bg-gray-700'

export async function Menu() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }
  const userName = session?.user?.name
  const userRole = session?.user?.role
  // Fallback for sessions issued before the roles array existed
  const userRoles = session?.user?.roles ?? (userRole ? [userRole] : [])

  const modules = visibleModules(userRoles)
  const liveModules = modules.filter(m => m.status === 'live')
  const soonModules = modules.filter(m => m.status === 'coming_soon')

  return (
    <div className="flex flex-col h-dvh w-56 bg-gray-800 border-r border-gray-600 shrink-0">
      <ToastContainer />
      <div className="p-4 border-b border-gray-600">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">
          MasterTech Hub
        </p>
        <p className="text-sm text-gray-100 truncate font-medium">{userName}</p>
        <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-mono uppercase tracking-widest border border-blue text-blue rounded">
          {userRole}
        </span>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-y-auto">
        <NavLink href="/" className={linkClass} activeClassName={activeClass}>
          <span className="text-sm font-medium">Home</span>
          <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
        </NavLink>
        {liveModules.map(module => {
          const items = visibleNavItems(module, userRoles)
          if (items.length > 0) {
            return (
              <div key={module.id} className="mt-2">
                <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  {module.name}
                </p>
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
            )
          }
          return (
            <NavLink
              key={module.id}
              href={module.href}
              className={linkClass}
              activeClassName={activeClass}
            >
              <span className="text-sm font-medium">{module.name}</span>
              <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          )
        })}
        {soonModules.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">
              Coming soon
            </p>
            {soonModules.map(module => (
              <span
                key={module.id}
                className="flex items-center px-3 py-2 text-sm text-gray-500 cursor-not-allowed select-none"
              >
                {module.name}
              </span>
            ))}
          </div>
        )}
      </nav>
      <div className="p-2 border-t border-gray-600">
        <form action={handleAuth}>
          <button
            type="submit"
            className="group flex items-center justify-between w-full px-3 py-2.5 rounded text-gray-300 border-l-2 border-l-transparent hover:border-l-red hover:text-red hover:bg-gray-700 transition-all duration-150"
          >
            <span className="text-sm font-medium">Sign Out</span>
            <Icons.LogOut className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>
      </div>
    </div>
  )
}
