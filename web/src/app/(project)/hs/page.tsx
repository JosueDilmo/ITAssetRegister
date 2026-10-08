import { requireHsRoleOrRedirect } from '@/features/auth/actions/requireHsRoleOrRedirect'
import { Menu } from '@/features/nav/components/menu'
import { FilePlus2 } from 'lucide-react'
import Link from 'next/link'

export default async function HsPage() {
  await requireHsRoleOrRedirect()

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <h1 className="font-heading text-lg font-semibold text-gray-50">
            H&S Permits
          </h1>
          <div>
            <Link
              href="/hs/new"
              className="inline-flex items-center gap-2 min-h-12 px-6 rounded border border-blue text-blue hover:bg-gray-700"
            >
              <FilePlus2 className="w-5 h-5" aria-hidden="true" />
              New W@H permit
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
