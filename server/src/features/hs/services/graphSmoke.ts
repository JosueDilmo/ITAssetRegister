import { randomBytes } from 'node:crypto'
import {
  type DriveItemRef,
  deleteItem,
  ensureFolder,
  getItem,
  getItemByPath,
  listChildren,
  putFile,
} from '../../../shared/services/graphDriveClient.js'
import { GraphError } from '../../../shared/services/graphFetch.js'
import { renderPdf } from '../../../shared/services/renderPdf.js'
import type { SharePointTargets } from '../config/sharePointTargets.js'
import { findHsFolder } from './hsFolder.js'

/**
 * D-07 Graph smoke run: orchestration, report model and markdown rendering.
 * Lives in src/ so it is typechecked and unit-tested with mocks; the CLI in
 * scripts/hs/smoke.ts only parses arguments. SharePointTargets is imported as a
 * type only so loading this module never evaluates the env modules.
 *
 * Write invariant (T-03-25): a run only ever creates its own _hs-smoke-* folders
 * under a configured container and writes inside ids it created itself. It
 * never overwrites, renames or deletes anything it did not create.
 */

export const BROAD_SCOPES = [
  'Files.ReadWrite.All',
  'Sites.ReadWrite.All',
  'Sites.Manage.All',
  'Sites.FullControl.All',
] as const

// A real-style project folder name (D-20b): spaces, dots, '&', apostrophe and a
// double space. Proves such names round-trip through create and list.
const REAL_NAME_PROBE = "PR9999 Test & Co. St. Andrew's  Double"

export function smokeFolderName(runId: string): string {
  return `_hs-smoke-${runId}`
}

export type SmokeTarget =
  | 'Token'
  | 'M&E'
  | 'QHSE Pre-approved'
  | 'QHSE Control'
  | 'Tickets'
  | 'Audit'

export interface SmokeStep {
  target: SmokeTarget
  step: string
  ok: boolean
  critical: boolean
  detail: string
}

export interface SmokeReport {
  runId: string
  startedAt: string
  tokenRoles: string[]
  steps: SmokeStep[]
  cleanup: { deleted: number; leftovers: string[] }
  audit?: { withHsFolder: number; withoutHsFolder: string[] }
  criticalFailure: boolean
}

export interface SmokeOptions {
  targets: SharePointTargets
  docx: { bytes: Buffer; fileName: string }
  runId?: string
  signal?: AbortSignal
  auditHsFolders?: boolean
  expectSelectedOnly?: boolean
  tickets?: { siteId: string; driveId: string } | null
  log?: (line: string) => void
}

interface Created {
  driveId: string
  itemId: string
  kind: 'file' | 'folder'
  label: string
}

interface Outcome<T> {
  ok: boolean
  detail: string
  value?: T
}

function good<T>(detail: string, value?: T): Outcome<T> {
  return { ok: true, detail, value }
}

function bad<T>(detail: string, value?: T): Outcome<T> {
  return { ok: false, detail, value }
}

function describeError(err: unknown): string {
  if (err instanceof GraphError) return `${err.status} ${err.code}`
  const message = err instanceof Error ? err.message : String(err)
  return message.length > 200 ? `${message.slice(0, 200)}...` : message
}

function defaultRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  return `${stamp}-${randomBytes(2).toString('hex')}`
}

export async function runSmoke(opts: SmokeOptions): Promise<SmokeReport> {
  const { targets, docx, signal } = opts
  const log = opts.log ?? (() => {})
  const runId = opts.runId ?? defaultRunId()
  const smokeName = smokeFolderName(runId)
  const me = targets.me

  const report: SmokeReport = {
    runId,
    startedAt: new Date().toISOString(),
    tokenRoles: [],
    steps: [],
    cleanup: { deleted: 0, leftovers: [] },
    criticalFailure: false,
  }

  const created: Created[] = []
  const smokeFolders: Created[] = []
  const containers = new Set<string>()
  const key = (driveId: string, itemId: string) => `${driveId}:${itemId}`

  function register(
    driveId: string,
    item: DriveItemRef | { id: string },
    kind: 'file' | 'folder',
    label: string
  ): void {
    created.push({ driveId, itemId: item.id, kind, label })
  }

  function isCreated(driveId: string, itemId: string): boolean {
    return created.some(c => c.driveId === driveId && c.itemId === itemId)
  }

  /** Write guard: a parent must be an id created in this run. */
  function assertOwnParent(driveId: string, parentItemId: string): void {
    if (!isCreated(driveId, parentItemId)) {
      throw new Error(
        'smoke write invariant: parent was not created by this run'
      )
    }
  }

  /** The only write allowed on a configured container: creating this run's folder. */
  async function createSmokeFolder(
    driveId: string,
    containerId: string,
    label: string
  ): Promise<DriveItemRef> {
    if (!containers.has(key(driveId, containerId))) {
      throw new Error('smoke write invariant: unknown container')
    }
    const folder = await ensureFolder(driveId, containerId, smokeName)
    const entry: Created = {
      driveId,
      itemId: folder.id,
      kind: 'folder',
      label: `${label}/${smokeName}`,
    }
    created.push(entry)
    smokeFolders.push(entry)
    return folder
  }

  let rootChildren: DriveItemRef[] | undefined
  async function loadRootChildren(rootId: string): Promise<DriveItemRef[]> {
    rootChildren ??= await listChildren(
      me.driveId,
      { itemId: rootId },
      { top: 200 }
    )
    return rootChildren
  }

  async function step<T>(
    target: SmokeTarget,
    name: string,
    critical: boolean,
    fn: () => Promise<Outcome<T>>
  ): Promise<T | undefined> {
    if (signal?.aborted) return undefined
    let outcome: Outcome<T>
    try {
      outcome = await fn()
    } catch (err) {
      outcome = bad(describeError(err))
    }
    report.steps.push({
      target,
      step: name,
      ok: outcome.ok,
      critical,
      detail: outcome.detail,
    })
    if (!outcome.ok && critical) report.criticalFailure = true
    log(
      `[${target}] ${name}: ${outcome.ok ? 'ok' : 'FAIL'} - ${outcome.detail}`
    )
    return outcome.value
  }

  async function cleanup(): Promise<void> {
    const files = created.filter(c => c.kind === 'file').reverse()
    const folders = created.filter(c => c.kind === 'folder').reverse()
    for (const item of [...files, ...folders]) {
      try {
        if (await deleteItem(item.driveId, item.itemId)) {
          report.cleanup.deleted++
        }
      } catch (err) {
        report.cleanup.leftovers.push(`${item.label} (${describeError(err)})`)
      }
    }
    for (const folder of smokeFolders) {
      try {
        if (await getItem(folder.driveId, folder.itemId)) {
          if (!report.cleanup.leftovers.some(l => l.startsWith(folder.label))) {
            report.cleanup.leftovers.push(folder.label)
          }
        }
      } catch (err) {
        report.cleanup.leftovers.push(
          `${folder.label} (404 check failed: ${describeError(err)})`
        )
      }
    }
  }

  try {
    // ---- M&E ----------------------------------------------------------
    const meRoot = await step(
      'M&E',
      'resolve projects root',
      true,
      async () => {
        const root = await getItemByPath(me.driveId, me.projectsRoot)
        if (!root) return bad<DriveItemRef>('projects root not found')
        return good(`found (${me.projectsRoot})`, root)
      }
    )

    if (meRoot) {
      containers.add(key(me.driveId, meRoot.id))
      const smoke = await step('M&E', 'create smoke folder', true, async () => {
        const folder = await createSmokeFolder(me.driveId, meRoot.id, 'M&E')
        return good(`created ${smokeName}`, folder)
      })

      if (smoke) {
        await step('M&E', 'upload docx and convert to PDF', true, async () => {
          assertOwnParent(me.driveId, smoke.id)
          const out = await renderPdf({
            docx: docx.bytes,
            fileName: docx.fileName,
            staging: { driveId: me.driveId, parentItemId: smoke.id },
          })
          register(me.driveId, { id: out.stagedItemId }, 'file', docx.fileName)
          return good(
            `PDF ${out.pdf.length} bytes in ${Math.round(out.elapsedMs)} ms via route ${out.route}`
          )
        })

        // D-20b names probe: real-style folder name, upload by id, and the
        // 1. Cons/5. H&S chain beneath it (D-20d detection).
        const named = await step(
          'M&E',
          'real-style folder name round trip',
          true,
          async () => {
            assertOwnParent(me.driveId, smoke.id)
            const folder = await ensureFolder(
              me.driveId,
              smoke.id,
              REAL_NAME_PROBE
            )
            register(me.driveId, folder, 'folder', REAL_NAME_PROBE)
            const listed = await listChildren(me.driveId, {
              itemId: smoke.id,
            })
            const found = listed.some(c => c.name === REAL_NAME_PROBE)
            return found
              ? good('listing returned the identical name', folder)
              : bad('listing did not return the identical name', folder)
          }
        )

        if (named) {
          await step('M&E', 'upload probe file by id', false, async () => {
            assertOwnParent(me.driveId, named.id)
            const file = await putFile({
              driveId: me.driveId,
              parentItemId: named.id,
              fileName: 'probe.txt',
              content: Buffer.from('hs smoke probe'),
              contentType: 'text/plain',
              conflictBehavior: 'fail',
            })
            register(me.driveId, file, 'file', 'probe.txt')
            return good('uploaded probe.txt by parent id')
          })

          await step(
            'M&E',
            'detect 1. Cons/5. H&S (D-20d)',
            false,
            async () => {
              let parent = named
              for (const name of me.projectHsPath.split('/')) {
                assertOwnParent(me.driveId, parent.id)
                parent = await ensureFolder(me.driveId, parent.id, name)
                register(me.driveId, parent, 'folder', name)
              }
              const withHs = await findHsFolder(named.id, targets)
              const without = await findHsFolder(smoke.id, targets)
              const ok = withHs !== null && without === null
              return {
                ok,
                detail: `with chain: ${withHs ? 'found' : 'null'}; without chain: ${without ? 'found' : 'null'}`,
              }
            }
          )
        }
      }
    }

    // ---- Audit (read-only, opt-in; D-20c) ----------------------------------
    if (opts.auditHsFolders) {
      await step('Audit', 'projects with 1. Cons/5. H&S', false, async () => {
        if (!meRoot) return bad('projects root unavailable')
        const children = await loadRootChildren(meRoot.id)
        const projects = children.filter(c => c.folder && /^PR/i.test(c.name))
        const audit = { withHsFolder: 0, withoutHsFolder: [] as string[] }
        report.audit = audit
        for (const project of projects) {
          if (signal?.aborted) break
          if (await findHsFolder(project.id, targets)) audit.withHsFolder++
          else audit.withoutHsFolder.push(project.name)
        }
        return good(
          `${audit.withHsFolder} of ${projects.length} open PR projects have ${me.projectHsPath}`
        )
      })
    }
  } finally {
    await cleanup()
  }

  return report
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')
}

export function renderSmokeMarkdown(report: SmokeReport): string {
  const lines: string[] = []
  lines.push(`### Smoke run ${report.runId} (${report.startedAt})`)
  lines.push('')
  lines.push(
    `Token roles: ${report.tokenRoles.length > 0 ? report.tokenRoles.join(', ') : '(not read)'}`
  )
  lines.push('')
  lines.push('| target | step | ok | detail |')
  lines.push('|---|---|---|---|')
  for (const s of report.steps) {
    const ok = s.ok ? 'yes' : s.critical ? 'NO (critical)' : 'no'
    lines.push(
      `| ${cell(s.target)} | ${cell(s.step)} | ${ok} | ${cell(s.detail)} |`
    )
  }
  if (report.audit) {
    const total =
      report.audit.withHsFolder + report.audit.withoutHsFolder.length
    lines.push('')
    lines.push(
      `1. Cons/5. H&S present: ${report.audit.withHsFolder} of ${total}`
    )
    if (report.audit.withoutHsFolder.length > 0) {
      lines.push('Without it:')
      for (const name of report.audit.withoutHsFolder) lines.push(`- ${name}`)
    }
  }
  lines.push('')
  const leftovers =
    report.cleanup.leftovers.length > 0
      ? report.cleanup.leftovers.join('; ')
      : 'none'
  lines.push(
    `Cleanup: deleted ${report.cleanup.deleted} item(s); leftovers: ${leftovers}`
  )
  lines.push('')
  lines.push(`Critical failure: ${report.criticalFailure ? 'yes' : 'no'}`)
  return lines.join('\n')
}
