import { requireHsRoleOrRedirect } from '@/features/auth/actions/requireHsRoleOrRedirect'
import { ProjectPicker } from '@/features/hs/components/ProjectPicker'
import { Menu } from '@/features/nav/components/menu'
import { getApiHsProjects } from '@/http/api'
import Link from 'next/link'

const NOT_CONFIGURED =
  'H&S SharePoint access is not configured on the server. Contact IT.'
const UNREACHABLE =
  'SharePoint is unreachable and no saved project list is available yet. Try again in a few minutes.'

// customFetch throws the parsed JSON body, so a failure carries error.code.
function errorCode(err: unknown): string | undefined {
  return (err as { error?: { code?: string } } | null)?.error?.code
}

export default async function NewPermitPage() {
  await requireHsRoleOrRedirect()

  let data: Awaited<ReturnType<typeof getApiHsProjects>> | null = null
  let failureCode: string | undefined
  try {
    data = await getApiHsProjects()
  } catch (err) {
    failureCode = errorCode(err)
  }

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
          {data ? (
            <ProjectPicker
              projects={data.projects}
              stale={data.stale}
              cachedAtLabel={cachedAtLabel}
            />
          ) : (
            <div className="flex flex-col gap-4 border border-red text-red rounded p-4">
              <p>
                {failureCode === 'HS_NOT_CONFIGURED'
                  ? NOT_CONFIGURED
                  : UNREACHABLE}
              </p>
              <Link
                href="/hs/new"
                className="inline-flex items-center min-h-12 self-start px-6 rounded border border-blue text-blue hover:bg-gray-700"
              >
                Try again
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
