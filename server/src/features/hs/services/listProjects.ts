import {
  ExternalServiceError,
  HsNotConfiguredError,
} from '../../../errors/index.js'
import { listChildren } from '../../../shared/services/graphDriveClient.js'
import { GraphError } from '../../../shared/services/graphFetch.js'
import { getSharePointTargets } from '../config/sharePointTargets.js'
import { deriveProjectCode } from './projectCode.js'

export interface HsProject {
  id: string
  name: string
  code: string
  webUrl: string
}

export interface ProjectList {
  projects: HsProject[]
  cachedAt: string
  stale: boolean
}

// D-18: every folder whose name starts with PR, in any case.
const PROJECT_FOLDER = /^PR/i

function compareProjects(a: HsProject, b: HsProject): number {
  return (
    a.name.localeCompare(b.name, 'en', {
      sensitivity: 'base',
      numeric: true,
    }) || a.id.localeCompare(b.id)
  )
}

// D-17: how long a fetched list is served without asking Graph again.
export const PROJECTS_TTL_MS = 10 * 60_000

let cache: { projects: HsProject[]; fetchedAt: number } | null = null
let inflight: Promise<void> | null = null

async function fetchProjects(): Promise<HsProject[]> {
  const targets = getSharePointTargets()

  // Children of the projects root only: never the library root, never
  // recursive (D-20a).
  const items = await listChildren(targets.me.driveId, {
    path: targets.me.projectsRoot,
  })

  const projects: HsProject[] = []
  for (const item of items) {
    if (!item.folder || !PROJECT_FOLDER.test(item.name)) continue
    try {
      const { code, fromPrefix } = deriveProjectCode(item.name)
      if (!fromPrefix) {
        console.warn(
          'hs projects: no PR<digits> prefix, using sanitised name',
          item.name
        )
      }
      // name is the raw SharePoint folder name, unchanged (D-15).
      projects.push({
        id: item.id,
        name: item.name,
        code,
        webUrl: item.webUrl,
      })
    } catch {
      console.warn('hs projects: skipping folder with unusable name', item.name)
    }
  }
  return projects.sort(compareProjects)
}

// Single-flight (SP-03): concurrent callers share one Graph listing.
function refresh(): Promise<void> {
  inflight ??= (async () => {
    const projects = await fetchProjects()
    cache = { projects, fetchedAt: Date.now() }
  })().finally(() => {
    inflight = null
  })
  return inflight
}

function toList(entry: {
  projects: HsProject[]
  fetchedAt: number
}): ProjectList {
  // cachedAt is always the time the list was taken (D-17).
  return {
    projects: entry.projects,
    cachedAt: new Date(entry.fetchedAt).toISOString(),
    stale: false,
  }
}

export async function listProjects(): Promise<ProjectList> {
  // HsNotConfiguredError propagates untouched: never cached, never staled (D-24).
  getSharePointTargets()

  if (cache && Date.now() - cache.fetchedAt < PROJECTS_TTL_MS) {
    return toList(cache)
  }

  try {
    await refresh()
  } catch (err) {
    if (err instanceof HsNotConfiguredError) throw err
    // Server-side log only: Graph status, code and request id (T-03-30).
    if (err instanceof GraphError) {
      console.warn('hs projects: SharePoint listing failed', {
        status: err.status,
        code: err.code,
        requestId: err.requestId,
      })
    } else {
      console.warn(
        'hs projects: SharePoint listing failed',
        err instanceof Error ? err.name : 'unknown'
      )
    }
    // D-17: never present the cached list as fresh.
    if (cache) return { ...toList(cache), stale: true }
    throw new ExternalServiceError(
      'SharePoint is unreachable and no cached project list exists'
    )
  }

  // refresh() just assigned the cache.
  return toList(cache as NonNullable<typeof cache>)
}

// Phase 4 forged-id check: answers from the same cached list (T-03-31).
export async function isKnownProject(id: string): Promise<boolean> {
  return (await listProjects()).projects.some(project => project.id === id)
}
