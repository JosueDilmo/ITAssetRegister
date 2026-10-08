import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  })
)
const getApiHsProjects = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/http/api', () => ({ getApiHsProjects }))
vi.mock('@/features/auth/actions/requireHsRoleOrRedirect', () => ({
  requireHsRoleOrRedirect: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/features/nav/components/menu', () => ({ Menu: () => null }))
vi.mock('@/features/hs/components/ProjectPicker', () => ({
  ProjectPicker: () => <div>picker</div>,
}))

import NewPermitPage from '@/app/(project)/hs/new/page'

// customFetch throws the parsed JSON body of a failed response.
const apiError = (code: string) => ({ error: { code, message: 'x' } })

describe('/hs/new failure handling (WR-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('redirects an expired session (AUTHENTICATION_ERROR) to /signin', async () => {
    getApiHsProjects.mockRejectedValue(apiError('AUTHENTICATION_ERROR'))
    await expect(NewPermitPage()).rejects.toThrow('REDIRECT:/signin')
  })

  it('redirects an authorisation failure (AUTHORIZATION_ERROR) to /', async () => {
    getApiHsProjects.mockRejectedValue(apiError('AUTHORIZATION_ERROR'))
    await expect(NewPermitPage()).rejects.toThrow('REDIRECT:/')
  })

  it('shows the not-configured message for HS_NOT_CONFIGURED', async () => {
    getApiHsProjects.mockRejectedValue(apiError('HS_NOT_CONFIGURED'))
    render(await NewPermitPage())
    expect(screen.getByText(/not configured on the server/)).toBeTruthy()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('shows the unreachable message for EXTERNAL_SERVICE_ERROR without logging an error', async () => {
    getApiHsProjects.mockRejectedValue(apiError('EXTERNAL_SERVICE_ERROR'))
    render(await NewPermitPage())
    expect(screen.getByText(/SharePoint is unreachable/)).toBeTruthy()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('logs the code of an unexpected failure on the web server', async () => {
    getApiHsProjects.mockRejectedValue(apiError('INTERNAL_SERVER_ERROR'))
    render(await NewPermitPage())
    expect(console.error).toHaveBeenCalledWith(
      'hs/new: project list failed',
      'INTERNAL_SERVER_ERROR'
    )
    expect(redirect).not.toHaveBeenCalled()
  })

  it('logs a network failure that carries no code', async () => {
    getApiHsProjects.mockRejectedValue(new TypeError('fetch failed'))
    render(await NewPermitPage())
    expect(console.error).toHaveBeenCalledWith(
      'hs/new: project list failed',
      'no code'
    )
  })

  it('renders the picker when the list loads', async () => {
    getApiHsProjects.mockResolvedValue({
      projects: [],
      stale: false,
      cachedAt: '2026-10-06T10:00:00.000Z',
    })
    render(await NewPermitPage())
    expect(screen.getByText('picker')).toBeTruthy()
  })
})
