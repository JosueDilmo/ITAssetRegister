import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'
import { Menu } from '@/features/nav/components/menu'
import { KanbanBoard } from '@/features/tickets/components/KanbanBoard'

export default async function TicketsPage() {
  await requireAdminOrRedirect()

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
