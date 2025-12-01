import handleAuth from '@/app/actions/handleAuth'
import { auth } from '@/app/lib/auth'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ToastContainer } from 'react-toastify'
import { Button } from '../../components/button'

export async function Menu() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }
  const userName = session?.user?.name
  const userCredentials = session?.user?.role

  return (
    <div className="flex flex-col h-dvh gap-2 w-56 p-2">
      <ToastContainer />
      <p>User: {userName} </p>
      <p>Role: {userCredentials}</p>
      <Link href="/">
        <Button>
          Home
          <Icons.SquareArrowUpRight />
        </Button>
      </Link>
      <Link href="/registration">
        <Button>
          Register
          <Icons.SquareArrowUpRight />
        </Button>
      </Link>
      <Link href="/manager">
        <Button>
          Management
          <Icons.SquareArrowUpRight />
        </Button>
      </Link>
      <form action={handleAuth} className="mt-auto">
        <Button className="w-36 h-8" type="submit">
          Sign Out
          <Icons.LogOut />
        </Button>
      </form>
    </div>
  )
}
