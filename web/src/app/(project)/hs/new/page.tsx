import { requireHsRoleOrRedirect } from '@/features/auth/actions/requireHsRoleOrRedirect'
import { ProjectPicker } from '@/features/hs/components/ProjectPicker'
import { Menu } from '@/features/nav/components/menu'
import { getApiHsProjects } from '@/http/api'

export default async function NewPermitPage() {
  await requireHsRoleOrRedirect()

  const data = await getApiHsProjects().catch(() => null)

  // Formatted on the server so client hydration cannot disagree (D-17).
  const cachedAtLabel = data
    ? new Intl.DateTimeFormat('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Dublin',
      }).format(new Date(data.cachedAt))
    : ''

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <h1 className="font-heading text-lg font-semibold text-gray-50">
            New W@H permit
          </h1>
          <p className="text-gray-100">Step 1: choose the project</p>
          {data && (
            <ProjectPicker
              projects={data.projects}
              stale={data.stale}
              cachedAtLabel={cachedAtLabel}
            />
          )}
        </div>
      </main>
    </div>
  )
}
