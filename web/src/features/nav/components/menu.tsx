import handleAuth from '@/features/auth/actions/handleAuth'
import { auth } from '@/shared/lib/auth'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ToastContainer } from 'react-toastify'

export async function Menu() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }
  const userName = session?.user?.name
  const userCredentials = session?.user?.role

  return (
    <div className="flex flex-col h-dvh w-56 bg-gray-800 border-r border-gray-600 shrink-0">
      <ToastContainer />
      <div className="p-4 border-b border-gray-600">
        <p className="text-sm text-gray-100 truncate font-medium">{userName}</p>
        <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-mono uppercase tracking-widest border border-blue text-blue rounded">
          {userCredentials}
        </span>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5 p-2">
        <Link
          href="/"
          className="group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150"
        >
          <span className="text-sm font-medium">Home</span>
          <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/registration"
          className="group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150"
        >
          <span className="text-sm font-medium">Register</span>
          <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/manager"
          className="group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150"
        >
          <span className="text-sm font-medium">Management</span>
          <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/support"
          className="group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150"
        >
          <span className="text-sm font-medium">Support</span>
          <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
        {userCredentials === 'admin' && (
          <Link
            href="/tickets"
            className="group flex items-center justify-between px-3 py-2.5 rounded text-gray-200 border-l-2 border-l-transparent hover:border-l-blue hover:text-blue hover:bg-gray-700 transition-all duration-150"
          >
            <span className="text-sm font-medium">Tickets</span>
            <Icons.SquareArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </nav>
      <div className="p-2 border-t border-gray-600">
        <form action={handleAuth}>
          <button
            type="submit"
            className="group flex items-center justify-between w-full px-3 py-2.5 rounded text-gray-300 border-l-2 border-l-transparent hover:border-l-red hover:text-red hover:bg-gray-700 transition-all duration-150"
          >
            <span className="text-sm font-medium">Sign Out</span>
            <Icons.LogOut className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>
      </div>
    </div>
  )
}
