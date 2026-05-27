import { redirect } from 'next/navigation'
import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { KanbanBoard } from '@/features/tickets/components/KanbanBoard'

export default async function TicketsPage() {
  const user = await getCurrentITAssetUser()
  if (!user) redirect('/signin')

  if (user.role !== 'admin') {
    return (
      <div className="flex w-full">
        <Menu />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Access denied. Admin role required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
