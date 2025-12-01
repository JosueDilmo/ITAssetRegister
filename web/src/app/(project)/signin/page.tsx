import handleAuth from '@/app/actions/handleAuth'
import { auth } from '@/app/lib/auth'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

// SEO Metadata
export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

export default async function SignIn() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <div className=" flex flex-col items-center min-h-screen p-24">
      <form action={handleAuth}>
        <button
          type="submit"
          className="bg-blue-500 text-gray-50 p-2 rounded-md"
        >
          Sign In with Microsoft
        </button>
      </form>
    </div>
  )
}
