import {
  moduleDisplay,
  moduleHref,
  visibleModules,
} from '@/shared/constants/modules'
import { auth } from '@/shared/lib/auth'
import { ModuleCard } from './ModuleCard'

export async function ModuleDashboard() {
  const session = await auth()
  const userRole = session?.user?.role
  // Fallback for sessions issued before the roles array existed
  const userRoles = session?.user?.roles ?? (userRole ? [userRole] : [])
  const modules = visibleModules(userRoles)

  return (
    <section className="flex-1 p-8 overflow-y-auto">
      <h2 className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-6">
        Modules
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map(module => (
          <ModuleCard
            key={module.id}
            module={moduleDisplay(module, userRoles)}
            href={moduleHref(module, userRoles)}
          />
        ))}
      </div>
    </section>
  )
}
