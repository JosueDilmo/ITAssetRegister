import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  })
)
const getUser = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/features/auth/actions/getCurrentITAssetUser', () => ({
  getCurrentITAssetUser: getUser,
}))

import { requireHsRoleOrRedirect } from '@/features/auth/actions/requireHsRoleOrRedirect'

describe('requireHsRoleOrRedirect', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects a visitor without a session to /signin', async () => {
    getUser.mockResolvedValue(null)
    await expect(requireHsRoleOrRedirect()).rejects.toThrow('REDIRECT:/signin')
  })

  it.each(['staff', 'hr', 'dept_manager', 'viewer'])(
    'silently redirects %s to / (D-06)',
    async role => {
      getUser.mockResolvedValue({ role, roles: [role], email: 'a@b.ie' })
      await expect(requireHsRoleOrRedirect()).rejects.toThrow('REDIRECT:/')
      expect(redirect).toHaveBeenCalledWith('/')
    }
  )

  it.each(['site_supervisor', 'hs_officer', 'admin'])(
    'lets %s through',
    async role => {
      getUser.mockResolvedValue({ role, roles: [role], email: 'a@b.ie' })
      await expect(requireHsRoleOrRedirect()).resolves.toMatchObject({
        roles: [role],
      })
      expect(redirect).not.toHaveBeenCalled()
    }
  )

  it('uses the full roles array, not the badge role (D-02)', async () => {
    getUser.mockResolvedValue({
      role: 'hr',
      roles: ['hr', 'site_supervisor'],
      email: 'a@b.ie',
    })
    await expect(requireHsRoleOrRedirect()).resolves.toMatchObject({
      roles: ['hr', 'site_supervisor'],
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('falls back to [role] for a legacy session without roles', async () => {
    getUser.mockResolvedValue({ role: 'admin', email: 'a@b.ie' })
    await expect(requireHsRoleOrRedirect()).resolves.toMatchObject({
      roles: ['admin'],
    })
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('/hs landing page structure', () => {
  const page = readFileSync(
    join(__dirname, '../src/app/(project)/hs/page.tsx'),
    'utf8'
  )

  it('imports and awaits requireHsRoleOrRedirect()', () => {
    expect(page).toMatch(/import \{ requireHsRoleOrRedirect \}/)
    expect(page).toMatch(/await requireHsRoleOrRedirect\(\)/)
  })

  it('offers the single New W@H permit link to /hs/new (D-13)', () => {
    expect(page).toMatch(/href="\/hs\/new"/)
    expect(page).toMatch(/New W@H permit/)
  })

  it('the redirect helper is silent: no react-toastify import (D-06)', () => {
    const helper = readFileSync(
      join(
        __dirname,
        '../src/features/auth/actions/requireHsRoleOrRedirect.ts'
      ),
      'utf8'
    )
    expect(helper).not.toMatch(/react-toastify/)
  })
})
