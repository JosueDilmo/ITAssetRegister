import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pathname = vi.hoisted(() => ({ value: '/' }))
const redirect = vi.hoisted(() => vi.fn())
const auth = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
  redirect,
}))
vi.mock('next/link', () => ({
  default: ({
    href,
    className,
    children,
  }: { href: string; className?: string; children: ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))
vi.mock('@/shared/lib/auth', () => ({ auth }))
vi.mock('react-toastify', () => ({ ToastContainer: () => null }))
vi.mock('@/features/auth/actions/handleAuth', () => ({ default: vi.fn() }))

import RegistrationIndex from '@/app/(project)/registration/page'
import ManagerIndex from '@/app/(project)/manager/page'
import { Menu } from '@/features/nav/components/menu'
import { NavGroup } from '@/features/nav/components/navGroup'
import { NavLink } from '@/features/nav/components/navLink'
import {
  MODULES,
  moduleHref,
  visibleModules,
} from '@/shared/constants/modules'

const items = [
  { name: 'Asset', href: '/registration/asset' },
  { name: 'Licence', href: '/registration/licence' },
]

describe('NavGroup accordion (NAV-01)', () => {
  it('is collapsed by default when no child is active', () => {
    pathname.value = '/account'
    render(<NavGroup label="Register" items={items} />)
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.queryByText('Asset')).toBeNull()
  })

  it('auto-expands when a child route is active', () => {
    pathname.value = '/registration/licence'
    render(<NavGroup label="Register" items={items} />)
    expect(screen.getByText('Asset')).toBeInTheDocument()
    expect(screen.getByText('Licence')).toBeInTheDocument()
  })

  it('toggles open and closed on click', () => {
    pathname.value = '/account'
    render(<NavGroup label="Register" items={items} />)
    fireEvent.click(screen.getByText('Register'))
    expect(screen.getByText('Licence')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Register'))
    expect(screen.queryByText('Licence')).toBeNull()
  })
})

describe('NavLink active highlight (NAV-02)', () => {
  const props = { className: 'base', activeClassName: 'is-active' }

  it('highlights when the pathname starts with href', () => {
    pathname.value = '/manager/licence/123'
    render(
      <NavLink href="/manager/licence" {...props}>
        L
      </NavLink>
    )
    expect(screen.getByText('L').closest('a')).toHaveClass('is-active')
  })

  it('does not highlight a different route', () => {
    pathname.value = '/manager/asset'
    render(
      <NavLink href="/manager/licence" {...props}>
        L
      </NavLink>
    )
    expect(screen.getByText('L').closest('a')).not.toHaveClass('is-active')
  })

  it('root link is active only on exactly /', () => {
    pathname.value = '/account'
    render(
      <NavLink href="/" {...props}>
        H
      </NavLink>
    )
    expect(screen.getByText('H').closest('a')).not.toHaveClass('is-active')
  })
})

describe('Menu structure for admin (NAV-02)', () => {
  beforeEach(() => {
    pathname.value = '/registration/asset'
    auth.mockResolvedValue({
      user: { name: 'N', role: 'admin', roles: ['admin'] },
    })
  })

  it('shows Register and Management groups plus flat Support and Tickets', async () => {
    render(await Menu())
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.getByText('Management')).toBeInTheDocument()
    // Register is expanded because /registration/asset is active
    expect(screen.getByText('Asset')).toBeInTheDocument()
    expect(screen.getByText('Licence')).toBeInTheDocument()
    expect(screen.getByText('Support').closest('a')).toHaveAttribute(
      'href',
      '/support'
    )
    expect(screen.getByText('Tickets').closest('a')).toHaveAttribute(
      'href',
      '/tickets'
    )
  })

  it('Management children are IT Assets, Staff, Licences when expanded', async () => {
    pathname.value = '/manager/asset'
    render(await Menu())
    expect(screen.getByText('IT Assets')).toBeInTheDocument()
    expect(screen.getByText('Licences').closest('a')).toHaveAttribute(
      'href',
      '/manager/licence'
    )
    expect(screen.getByText('Staff')).toBeInTheDocument()
  })

  it('non-admin sees no Register/Management groups', async () => {
    auth.mockResolvedValue({
      user: { name: 'N', role: 'viewer', roles: ['viewer'] },
    })
    render(await Menu())
    expect(screen.queryByText('Register')).toBeNull()
    expect(screen.queryByText('Management')).toBeNull()
    expect(screen.queryByText('Tickets')).toBeNull()
  })
})

describe('index redirects (NAV-03)', () => {
  beforeEach(() => redirect.mockClear())

  it('/registration redirects to /registration/asset', () => {
    RegistrationIndex()
    expect(redirect).toHaveBeenCalledWith('/registration/asset')
  })

  it('/manager redirects to /manager/asset', () => {
    ManagerIndex()
    expect(redirect).toHaveBeenCalledWith('/manager/asset')
  })
})

describe('module registry (NAV-04)', () => {
  it('Licences is a live module visible to admin with its href', () => {
    const m = MODULES.find(x => x.id === 'licences')
    expect(m?.status).toBe('live')
    expect(visibleModules(['admin'])).toContain(m)
    expect(moduleHref(m!, ['admin'])).toBe('/registration/licence')
    expect(visibleModules(['viewer'])).not.toContain(m)
  })

  it('Tickets is live and reachable for admin only', () => {
    const m = MODULES.find(x => x.id === 'tickets')
    expect(m?.status).toBe('live')
    expect(moduleHref(m!, ['admin'])).toBe('/tickets')
    expect(visibleModules(['admin'])).toContain(m)
    expect(visibleModules(['viewer'])).not.toContain(m)
  })
})
