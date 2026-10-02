import { Menu } from '@/features/nav/components/menu'

const SKELETON_CARDS = ['profile', 'assets', 'licences', 'tickets']

export default function AccountLoading() {
  return (
    <div className="flex w-full h-dvh">
      <Menu />
      <main className="flex-1 overflow-y-auto p-8">
        <div
          aria-busy="true"
          className="mx-auto flex w-full max-w-4xl flex-col gap-6"
        >
          <span className="sr-only">Loading your account</span>
          <h1 className="font-heading text-lg font-semibold text-gray-50">
            My Account
          </h1>
          {SKELETON_CARDS.map(card => (
            <div
              key={card}
              className="rounded border border-gray-600 bg-gray-800 p-6 animate-pulse"
            >
              <div className="flex flex-col gap-2">
                <div className="h-3 w-1/3 rounded bg-gray-600" />
                <div className="h-3 w-2/3 rounded bg-gray-600" />
                <div className="h-3 w-1/2 rounded bg-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
