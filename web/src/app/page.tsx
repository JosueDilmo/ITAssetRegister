import { redirect } from 'next/navigation'
import { Menu } from '@/features/nav/components/menu'
import { auth } from '@/shared/lib/auth'

export default async function Home() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="flex w-full">
      <Menu />
    </div>
  )
}
