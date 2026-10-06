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

export async function listProjects(): Promise<ProjectList> {
  // HsNotConfiguredError propagates untouched (D-24).
  const targets = getSharePointTargets()

  try {
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
        console.warn(
          'hs projects: skipping folder with unusable name',
          item.name
        )
      }
    }
    projects.sort(compareProjects)

    return { projects, cachedAt: new Date().toISOString(), stale: false }
  } catch (err) {
    if (err instanceof HsNotConfiguredError) throw err
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
    throw new ExternalServiceError(
      'SharePoint is unreachable and no cached project list exists'
    )
  }
}
