import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../shared/services/graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))
vi.mock('../../../shared/services/graphDriveClient.js', () => ({
  listChildren: vi.fn(),
}))
vi.mock('../config/sharePointTargets.js', () => ({
  getSharePointTargets: vi.fn(),
}))

const TARGETS = {
  me: {
    siteId: 'site-me',
    driveId: 'drive-me',
    projectsRoot: '01_Proj/Open',
    projectHsPath: '1. Cons/5. H&S',
    permitsFolder: 'Permits',
  },
  qhse: {
    siteId: 'site-qhse',
    preapproved: { driveId: 'd-pre', root: '' },
    control: { driveId: 'd-ctl', root: '' },
  },
}

function folder(id: string, name: string) {
  return { id, name, webUrl: `https://sp.example/${id}`, folder: {} }
}

const FIXTURE = [folder('i-2', 'PR1002 Beta'), folder('i-1', 'PR1001 Alpha')]

async function load() {
  const service = await import('./listProjects.js')
  const { listChildren } = await import(
    '../../../shared/services/graphDriveClient.js'
  )
  const { getSharePointTargets } = await import(
    '../config/sharePointTargets.js'
  )
  const { GraphError } = await import('../../../shared/services/graphFetch.js')
  const { ExternalServiceError, HsNotConfiguredError } = await import(
    '../../../errors/index.js'
  )
  // Mock instances survive vi.resetModules: clear calls and implementations.
  vi.mocked(listChildren).mockReset()
  vi.mocked(getSharePointTargets).mockReset()
  vi.mocked(getSharePointTargets).mockReturnValue(TARGETS)
  return {
    ...service,
    listChildren: vi.mocked(listChildren),
    getSharePointTargets: vi.mocked(getSharePointTargets),
    GraphError,
    ExternalServiceError,
    HsNotConfiguredError,
  }
}

describe('listProjects cache', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T10:00:00.000Z'))
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('exposes a 10 minute TTL', async () => {
    const { PROJECTS_TTL_MS } = await load()
    expect(PROJECTS_TTL_MS).toBe(600_000)
  })

  it('serves a second call within the TTL from cache with the same cachedAt', async () => {
    const { listProjects, listChildren } = await load()
    listChildren.mockResolvedValue(FIXTURE)

    const first = await listProjects()
    vi.advanceTimersByTime(599_000)
    const second = await listProjects()

    expect(listChildren).toHaveBeenCalledTimes(1)
    expect(second.cachedAt).toBe(first.cachedAt)
    expect(second.stale).toBe(false)
    expect(second.projects.map(p => p.name)).toEqual([
      'PR1001 Alpha',
      'PR1002 Beta',
    ])
  })

  it('refreshes once the TTL has elapsed', async () => {
    const { listProjects, listChildren, PROJECTS_TTL_MS } = await load()
    listChildren.mockResolvedValue(FIXTURE)

    const first = await listProjects()
    vi.advanceTimersByTime(PROJECTS_TTL_MS + 1)
    const second = await listProjects()

    expect(listChildren).toHaveBeenCalledTimes(2)
    expect(second.cachedAt).not.toBe(first.cachedAt)
    expect(second.stale).toBe(false)
  })

  it('shares one Graph listing between concurrent callers (single-flight)', async () => {
    const { listProjects, listChildren } = await load()
    let release: (items: ReturnType<typeof folder>[]) => void = () => {}
    listChildren.mockReturnValue(
      new Promise(resolve => {
        release = resolve
      })
    )

    const calls = [listProjects(), listProjects(), listProjects()]
    release(FIXTURE)
    const results = await Promise.all(calls)

    expect(listChildren).toHaveBeenCalledTimes(1)
    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
    expect(results[0].projects).toHaveLength(2)
  })

  it('returns the cached list flagged stale with the original cachedAt when a refresh fails', async () => {
    const { listProjects, listChildren, GraphError, PROJECTS_TTL_MS } =
      await load()
    listChildren.mockResolvedValueOnce(FIXTURE)
    const first = await listProjects()

    vi.advanceTimersByTime(PROJECTS_TTL_MS + 1)
    listChildren.mockRejectedValueOnce(
      new GraphError(503, 'serviceNotAvailable', 'req-9', true)
    )
    const second = await listProjects()

    expect(second.stale).toBe(true)
    expect(second.cachedAt).toBe(first.cachedAt)
    expect(second.projects).toEqual(first.projects)
    const logged = JSON.stringify(warn.mock.calls)
    expect(logged).toContain('503')
    expect(logged).toContain('serviceNotAvailable')
    expect(logged).toContain('req-9')
  })

  it('rejects with ExternalServiceError when the refresh fails and nothing is cached', async () => {
    const { listProjects, listChildren, GraphError, ExternalServiceError } =
      await load()
    listChildren.mockRejectedValue(
      new GraphError(503, 'serviceNotAvailable', 'req-1', true)
    )

    const err = await listProjects().catch(e => e)

    expect(err).toBeInstanceOf(ExternalServiceError)
    expect(err.message).not.toContain('serviceNotAvailable')
  })

  it('never turns HsNotConfiguredError into a stale answer', async () => {
    const {
      listProjects,
      listChildren,
      getSharePointTargets,
      HsNotConfiguredError,
      PROJECTS_TTL_MS,
    } = await load()
    listChildren.mockResolvedValue(FIXTURE)
    await listProjects()

    vi.advanceTimersByTime(PROJECTS_TTL_MS + 1)
    getSharePointTargets.mockImplementation(() => {
      throw new HsNotConfiguredError()
    })

    await expect(listProjects()).rejects.toBeInstanceOf(HsNotConfiguredError)
  })

  it('backs off after a failed refresh: serves stale without calling Graph until the window ends', async () => {
    const {
      listProjects,
      listChildren,
      GraphError,
      PROJECTS_TTL_MS,
      REFRESH_FAILURE_BACKOFF_MS,
    } = await load()
    listChildren.mockResolvedValueOnce(FIXTURE)
    const first = await listProjects()

    vi.advanceTimersByTime(PROJECTS_TTL_MS + 1)
    listChildren.mockRejectedValueOnce(new GraphError(503, 'down', null, true))
    expect((await listProjects()).stale).toBe(true)
    expect(listChildren).toHaveBeenCalledTimes(2)

    // Inside the window: no new Graph call, still stale, original cachedAt.
    vi.advanceTimersByTime(REFRESH_FAILURE_BACKOFF_MS - 1000)
    const during = await listProjects()
    expect(during.stale).toBe(true)
    expect(during.cachedAt).toBe(first.cachedAt)
    expect(listChildren).toHaveBeenCalledTimes(2)

    // After the window: Graph is asked again, and a failure restarts the window.
    vi.advanceTimersByTime(2000)
    listChildren.mockRejectedValueOnce(new GraphError(503, 'down', null, true))
    expect((await listProjects()).stale).toBe(true)
    expect(listChildren).toHaveBeenCalledTimes(3)
    await listProjects()
    expect(listChildren).toHaveBeenCalledTimes(3)
  })

  it('clears stale after a later successful refresh', async () => {
    const {
      listProjects,
      listChildren,
      GraphError,
      PROJECTS_TTL_MS,
      REFRESH_FAILURE_BACKOFF_MS,
    } = await load()
    listChildren.mockResolvedValueOnce(FIXTURE)
    await listProjects()

    vi.advanceTimersByTime(PROJECTS_TTL_MS + 1)
    listChildren.mockRejectedValueOnce(new GraphError(503, 'down', null, true))
    expect((await listProjects()).stale).toBe(true)

    vi.advanceTimersByTime(REFRESH_FAILURE_BACKOFF_MS + 1)
    listChildren.mockResolvedValueOnce(FIXTURE)
    const recovered = await listProjects()

    expect(recovered.stale).toBe(false)
    expect(listChildren).toHaveBeenCalledTimes(3)
  })

  it('isKnownProject answers from the same cached list', async () => {
    const { isKnownProject, listChildren } = await load()
    listChildren.mockResolvedValue(FIXTURE)

    expect(await isKnownProject('i-1')).toBe(true)
    expect(await isKnownProject('forged-id')).toBe(false)
    expect(listChildren).toHaveBeenCalledTimes(1)
  })
})
