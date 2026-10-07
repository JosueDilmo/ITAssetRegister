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
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { ModuleDashboard } from '@/features/home/components/ModuleDashboard'
import { Menu } from '@/features/nav/components/menu'
import { MODULES, moduleHref, visibleModules } from '@/shared/constants/modules'
import { HS_ROLES, ROLE_PRIORITY, highestRole } from '@/shared/lib/roles'

describe('roles', () => {
  it('maps a lone site_supervisor to site_supervisor, not staff (D-01)', () => {
    expect(highestRole(['site_supervisor'])).toBe('site_supervisor')
  })

  it('picks the higher priority role for a multi-role user (D-02)', () => {
    expect(highestRole(['site_supervisor', 'dept_manager'])).toBe(
      'dept_manager'
    )
    expect(highestRole(['staff', 'site_supervisor'])).toBe('site_supervisor')
  })

  it('falls back to staff for an unknown role', () => {
    expect(highestRole(['unknown'])).toBe('staff')
  })

  it('orders ROLE_PRIORITY admin > hr > hs_officer > dept_manager > site_supervisor > staff', () => {
    expect(ROLE_PRIORITY).toEqual([
      'admin',
      'hr',
      'hs_officer',
      'dept_manager',
      'site_supervisor',
      'staff',
    ])
  })

  it('exposes HS_ROLES as site_supervisor, hs_officer, admin', () => {
    expect(HS_ROLES).toEqual(['site_supervisor', 'hs_officer', 'admin'])
  })
})

describe('H&S Permits module registry', () => {
  const hs = MODULES.find(m => m.id === 'hs')!

  it.each([['site_supervisor'], ['hs_officer'], ['admin']])(
    'is visible to %s',
    role => {
      expect(visibleModules([role]).some(m => m.id === 'hs')).toBe(true)
    }
  )

  it.each([['staff'], ['hr'], ['dept_manager'], ['viewer']])(
    'is hidden from %s, even under Coming soon',
    role => {
      expect(visibleModules([role]).some(m => m.id === 'hs')).toBe(false)
    }
  )

  it('is a live module named H&S Permits linking /hs', () => {
    expect(hs.name).toBe('H&S Permits')
    expect(hs.href).toBe('/hs')
    expect(hs.status).toBe('live')
    expect(moduleHref(hs, ['site_supervisor'])).toBe('/hs')
  })
})

describe('H&S Permits in the sidebar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the Site Supervisor badge and the H&S Permits link', async () => {
    auth.mockResolvedValue({
      user: { name: 'N', role: 'site_supervisor', roles: ['site_supervisor'] },
    })
    render(await Menu())
    const badge = screen.getByText('Site Supervisor')
    expect(badge).toBeInTheDocument()
    expect(badge).not.toHaveClass('uppercase')
    expect(screen.queryByText('site_supervisor')).not.toBeInTheDocument()
    const link = screen.getByText('H&S Permits').closest('a')
    expect(link).toHaveAttribute('href', '/hs')
  })

  it('hides H&S Permits from staff everywhere', async () => {
    auth.mockResolvedValue({
      user: { name: 'N', role: 'staff', roles: ['staff'] },
    })
    render(await Menu())
    expect(screen.queryByText('H&S Permits')).not.toBeInTheDocument()
    expect(screen.queryByText('Health & Safety')).not.toBeInTheDocument()
  })

  it('shows one badge (Department Manager) and still the module for site_supervisor+dept_manager (D-02)', async () => {
    auth.mockResolvedValue({
      user: {
        name: 'N',
        role: 'dept_manager',
        roles: ['site_supervisor', 'dept_manager'],
      },
    })
    render(await Menu())
    expect(screen.getByText('Department Manager')).toBeInTheDocument()
    expect(screen.queryByText('Site Supervisor')).not.toBeInTheDocument()
    expect(screen.queryByText('dept_manager')).not.toBeInTheDocument()
    expect(screen.getByText('H&S Permits').closest('a')).toHaveAttribute(
      'href',
      '/hs'
    )
  })
})

describe('H&S Permits on Home', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders an H&S Permits card linking /hs for hs_officer', async () => {
    auth.mockResolvedValue({
      user: { name: 'N', role: 'hs_officer', roles: ['hs_officer'] },
    })
    render(await ModuleDashboard())
    expect(screen.getByText('H&S Permits').closest('a')).toHaveAttribute(
      'href',
      '/hs'
    )
  })
})
