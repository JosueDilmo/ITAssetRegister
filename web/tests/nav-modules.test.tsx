import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => vi.fn())
vi.mock('@/shared/lib/auth', () => ({ auth }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('react-toastify', () => ({ ToastContainer: () => null }))
vi.mock('@/features/auth/actions/handleAuth', () => ({ default: vi.fn() }))
vi.mock('@/features/nav/components/navLink', () => ({
  NavLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} data-nav>
      {children}
    </a>
  ),
}))
vi.mock('@/features/nav/components/navGroup', () => ({
  NavGroup: ({ label }: { label: string }) => <div>{label}</div>,
}))

import { Menu } from '@/features/nav/components/menu'
import { MODULES, moduleDisplay, moduleHref } from '@/shared/constants/modules'

describe('Menu My Account item', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(['admin', 'viewer'])(
    'shows My Account right after Home linking /account for %s',
    async role => {
      auth.mockResolvedValue({ user: { name: 'N', role, roles: [role] } })
      render(await Menu())
      const links = [...document.querySelectorAll('a[data-nav]')]
      expect(links[0]).toHaveTextContent('Home')
      expect(links[1]).toHaveTextContent('My Account')
      expect(links[1]).toHaveAttribute('href', '/account')
      expect(screen.getAllByText('My Account')).toHaveLength(1)
    }
  )
})

describe('IT Assets module card', () => {
  const m = MODULES.find(x => x.id === 'it-assets')!

  it('non-admin sees ACCOUNT / UserRound / /account', () => {
    const d = moduleDisplay(m, ['viewer'])
    expect(d.name).toBe('Account')
    expect(d.icon).toBe('UserRound')
    expect(moduleHref(m, ['viewer'])).toBe('/account')
  })

  it('admin keeps IT Assets -> /registration', () => {
    const d = moduleDisplay(m, ['admin'])
    expect(d.name).toBe('IT Assets')
    expect(d.icon).toBe('Laptop')
    expect(moduleHref(m, ['admin'])).toBe('/registration')
  })
})
