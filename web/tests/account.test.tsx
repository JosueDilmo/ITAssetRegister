import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  })
)
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/features/nav/components/menu', () => ({ Menu: () => null }))

import AccountLoading from '@/app/(project)/account/loading'
import MyStaffPage from '@/app/(project)/manager/me/page'
import { AssetsCard } from '@/features/account/components/AssetsCard'
import { LicencesCard } from '@/features/account/components/LicencesCard'
import { OpenTicketsCard } from '@/features/account/components/OpenTicketsCard'
import { ProfileCard } from '@/features/account/components/ProfileCard'

const LOAD = /could not load your account details/
const staff = {
  name: 'Ann Doe',
  email: 'ann@x.ie',
  department: 'Ops',
  jobTitle: 'Engineer',
  status: 'ACTIVE',
} as never

describe('ProfileCard', () => {
  it('renders staff data', () => {
    render(<ProfileCard staff={staff} email="ann@x.ie" failed={false} />)
    for (const t of ['Ann Doe', 'Ops', 'Engineer', 'ACTIVE'])
      expect(screen.getByText(t)).toBeInTheDocument()
  })
  it('null staff shows contact copy with email', () => {
    render(<ProfileCard staff={null} email="zed@x.ie" failed={false} />)
    expect(
      screen.getByText(
        'No staff record found for zed@x.ie. Contact IT support to be added.'
      )
    ).toBeInTheDocument()
  })
  it('shows load error', () => {
    render(<ProfileCard staff={null} email="z@x.ie" failed />)
    expect(screen.getByText(LOAD)).toBeInTheDocument()
    expect(screen.queryByText(/No staff record/)).toBeNull()
  })
})

describe('AssetsCard', () => {
  it('renders rows', () => {
    const assets = [
      {
        id: 1,
        assetNumber: 'A-1',
        type: 'Laptop',
        maker: 'Dell',
        name: 'XPS',
        serialNumber: 'SN9',
      },
    ] as never
    render(<AssetsCard assets={assets} failed={false} />)
    expect(screen.getByText('A-1')).toBeInTheDocument()
    expect(screen.getByText('Dell XPS')).toBeInTheDocument()
    expect(screen.getByText(/Serial: SN9/)).toBeInTheDocument()
  })
  it('empty and error copy', () => {
    const { unmount } = render(<AssetsCard assets={[]} failed={false} />)
    expect(screen.getByText('No assets assigned to you.')).toBeInTheDocument()
    unmount()
    render(<AssetsCard assets={[]} failed />)
    expect(screen.getByText(LOAD)).toBeInTheDocument()
  })
})

describe('LicencesCard', () => {
  const day = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    const p = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }
  const mk = (id: number, expiryDate: string | null) => ({
    id,
    licenceNumber: `L-${id}`,
    name: `Lic${id}`,
    licenceType: 'Sub',
    expiryDate,
    licenceKey: 'SECRET-KEY',
    notes: 'SECRET-NOTES',
    history: [{ x: 'SECRET-HIST' }],
  })

  it('colours expiry and leaks no secrets', () => {
    const licences = [
      mk(1, day(-5)),
      mk(2, day(10)),
      mk(3, day(200)),
      mk(4, null),
    ] as never
    const { container } = render(
      <LicencesCard licences={licences} failed={false} />
    )
    const exp = (n: number) => screen.getAllByText(/Expires:/)[n - 1]
    expect(exp(1)).toHaveTextContent('(expired)')
    expect(exp(1).className).toContain('text-red')
    expect(exp(2).className).toContain('text-orange-500')
    expect(exp(3).className).toContain('text-gray-100')
    expect(exp(4)).toHaveTextContent('No expiry')
    expect(container.textContent).not.toMatch(/SECRET/)
  })
  it('empty and error copy', () => {
    const { unmount } = render(<LicencesCard licences={[]} failed={false} />)
    expect(screen.getByText('No licences assigned to you.')).toBeInTheDocument()
    unmount()
    render(<LicencesCard licences={[]} failed />)
    expect(screen.getByText(LOAD)).toBeInTheDocument()
  })
})

describe('OpenTicketsCard', () => {
  it('renders rows linking to /support', () => {
    const tickets = [
      {
        id: 1,
        ticketNumber: 7,
        subject: 'Broken screen',
        status: 'IN_PROGRESS',
        updatedAt: '2026-01-02T10:00:00Z',
      },
    ] as never
    render(<OpenTicketsCard tickets={tickets} failed={false} />)
    const row = screen.getByText('Broken screen').closest('a')
    expect(row).toHaveAttribute('href', '/support')
    expect(screen.getByText('TKT-0007')).toBeInTheDocument()
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
  })
  it('empty and own error copy', () => {
    const { unmount } = render(<OpenTicketsCard tickets={[]} failed={false} />)
    expect(screen.getByText('You have no open tickets.')).toBeInTheDocument()
    unmount()
    render(<OpenTicketsCard tickets={[]} failed />)
    expect(screen.getByText(/could not load your tickets/)).toBeInTheDocument()
  })
})

describe('loading + legacy route', () => {
  it('renders four animate-pulse skeleton cards', () => {
    const { container } = render(<AccountLoading />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })
  it('manager/me redirects to /account', () => {
    expect(() => MyStaffPage()).toThrow('REDIRECT:/account')
    expect(
      readFileSync(
        join(__dirname, '../src/app/(project)/manager/me/page.tsx'),
        'utf8'
      )
    ).toContain("redirect('/account')")
  })
})
