import handleAuth from '@/features/auth/actions/handleAuth'
import { auth } from '@/shared/lib/auth'
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
    <div className="flex flex-col items-center gap-6 min-h-screen p-24">
      <div className="text-center">
        <h2 className="font-heading font-bold text-2xl tracking-widest uppercase text-gray-50">
          Mastertech Portal
        </h2>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-gray-400">
          Sign in to your Mastertech.ie account
        </p>
      </div>
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
