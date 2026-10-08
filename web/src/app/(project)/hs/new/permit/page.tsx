import { requireHsRoleOrRedirect } from '@/features/auth/actions/requireHsRoleOrRedirect'
import { Menu } from '@/features/nav/components/menu'
import { getApiHsProjects } from '@/http/api'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Continue target of the project picker. Phase 4 replaces the body with the
// W@H permit form; the server re-checks the id so the query string is never
// trusted (T-03-33).
export default async function NewPermitForProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  await requireHsRoleOrRedirect()

  const { projectId } = await searchParams
  if (!projectId) redirect('/hs/new')

  const list = await getApiHsProjects().catch(() => null)
  const project = list?.projects.find(p => p.id === projectId)
  if (!project) redirect('/hs/new')

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <h1 className="font-heading text-lg font-semibold text-gray-50">
            New W@H permit
          </h1>
          <div className="flex flex-col gap-1">
            <p className="whitespace-pre-wrap text-gray-50">{project.name}</p>
            <p className="font-mono text-xs text-gray-100">{project.code}</p>
          </div>
          <p className="text-gray-100">
            The W@H permit form for this project is not available yet.
          </p>
          <Link
            href="/hs/new"
            className="inline-flex items-center min-h-12 self-start px-6 rounded border border-blue text-blue hover:bg-gray-700"
          >
            Choose a different project
          </Link>
        </div>
      </main>
    </div>
  )
}
