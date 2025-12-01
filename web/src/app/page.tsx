import { redirect } from 'next/navigation'
import { Menu } from './(project)/nav/menu'
import { auth } from './lib/auth'

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
