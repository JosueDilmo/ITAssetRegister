import { ModuleDashboard } from '@/features/home/components/ModuleDashboard'
import { Menu } from '@/features/nav/components/menu'
import { auth } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="flex w-full">
      <Menu />
      <ModuleDashboard />
    </div>
  )
}
