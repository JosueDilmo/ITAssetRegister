import { redirect } from 'next/navigation'
import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { SupportBoard } from '@/features/support/components/SupportBoard'

export default async function SupportPage() {
  const user = await getCurrentITAssetUser()
  if (!user) redirect('/signin')

  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <SupportBoard />
      </div>
    </div>
  )
}
