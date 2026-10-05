import { existsSync, readFileSync } from 'node:fs'
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

import { requireAdminOrRedirect } from '@/features/auth/actions/requireAdminOrRedirect'

describe('requireAdminOrRedirect', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects a non-admin to /account', async () => {
    getUser.mockResolvedValue({ role: 'viewer', email: 'a@b.ie' })
    await expect(requireAdminOrRedirect()).rejects.toThrow('REDIRECT:/account')
    expect(redirect).toHaveBeenCalledWith('/account')
  })

  it('lets an admin through', async () => {
    getUser.mockResolvedValue({ role: 'admin', email: 'a@b.ie' })
    await expect(requireAdminOrRedirect()).resolves.toMatchObject({
      role: 'admin',
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects an unauthenticated visitor to /signin', async () => {
    getUser.mockResolvedValue(null)
    await expect(requireAdminOrRedirect()).rejects.toThrow('REDIRECT:/signin')
  })
})

const root = join(__dirname, '../src/app/(project)')
const guarded = [
  'manager/asset',
  'manager/staff',
  'manager/licence',
  'manager/[id]',
  'registration/asset',
  'registration/staff',
  'registration/licence',
  'tickets',
  'tickets/[id]',
]

describe('guarded pages', () => {
  it.each(guarded)('%s/page.tsx awaits requireAdminOrRedirect()', p => {
    const src = readFileSync(join(root, p, 'page.tsx'), 'utf8')
    expect(src).toMatch(/import \{ requireAdminOrRedirect \}/)
    expect(src).toMatch(/await requireAdminOrRedirect\(\)/)
  })

  it('no accessDenied toast component remains', () => {
    expect(
      existsSync(
        join(__dirname, '../src/features/auth/components/accessDenied.tsx')
      )
    ).toBe(false)
  })
})
