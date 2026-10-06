import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config/sharePointTargets.js', () => ({
  getSharePointTargets: vi.fn(),
}))

vi.mock('../../../shared/services/graphDriveClient.js', () => ({
  getItem: vi.fn(),
  getItemByPath: vi.fn(),
  getItemByRelativePath: vi.fn(),
  listChildren: vi.fn(),
  ensureFolder: vi.fn(),
  putFile: vi.fn(),
  putFileByPath: vi.fn(),
  deleteItem: vi.fn(),
}))

vi.mock('../../../shared/services/renderPdf.js', () => ({
  renderPdf: vi.fn(),
  DOCX_MIME: 'application/docx',
}))

vi.mock('../../../shared/services/graphAuth.js', () => ({
  getGraphAccessToken: vi.fn(),
  clearGraphTokenCache: vi.fn(),
}))

vi.mock('../../../shared/services/graphSharePointClient.js', () => ({
  uploadToSharePoint: vi.fn(),
}))

import {
  type ConflictBehavior,
  type DriveItemRef,
  deleteItem,
  ensureFolder,
  getItem,
  getItemByPath,
  getItemByRelativePath,
  listChildren,
  putFile,
  putFileByPath,
} from '../../../shared/services/graphDriveClient.js'
import { GraphError } from '../../../shared/services/graphFetch.js'
import { uploadToSharePoint } from '../../../shared/services/graphSharePointClient.js'
import { renderPdf } from '../../../shared/services/renderPdf.js'
import type { SharePointTargets } from '../config/sharePointTargets.js'
import {
  type SmokeOptions,
  renderSmokeMarkdown,
  runSmoke,
  smokeFolderName,
} from './graphSmoke.js'

const targets: SharePointTargets = {
  me: {
    siteId: 'me-site',
    driveId: 'me-drive',
    projectsRoot: '01_Proj/Open',
    projectHsPath: '1. Cons/5. H&S',
    permitsFolder: 'Permits',
  },
  qhse: {
    siteId: 'qhse-site',
    preapproved: { driveId: 'pre-drive', root: '' },
    control: { driveId: 'ctl-drive', root: '' },
  },
}

const docx = {
  bytes: Buffer.from('docx'),
  fileName: 'PM005-W@H Permit v02.docx',
}

const PROJECT_NAME = "PR9999 Test & Co. St. Andrew's  Double"

interface FakeNode {
  id: string
  name: string
  parentId: string | null
  kind: 'file' | 'folder'
  eTag: string
}

/** In-memory drive standing in for every mocked Graph call. */
function installFakeDrive(
  options: { autoCreateParents?: boolean; truncateAtTop?: number } = {}
) {
  const nodes = new Map<string, FakeNode>()
  const preexisting = new Set<string>()
  const createdIds = new Set<string>()
  const writeParents: string[] = []
  let seq = 0

  const add = (
    id: string,
    name: string,
    parentId: string | null,
    kind: 'file' | 'folder',
    pre = false
  ): FakeNode => {
    const node: FakeNode = { id, name, parentId, kind, eTag: `e${++seq}` }
    nodes.set(id, node)
    if (pre) preexisting.add(id)
    else createdIds.add(id)
    return node
  }
  add('root', '', null, 'folder', true)
  add('proj', '01_Proj', 'root', 'folder', true)
  add('root-open', 'Open', 'proj', 'folder', true)
  for (const [i, name] of [
    'PR1001 Alpha',
    'PR1002 Beta',
    'PR1003 Gamma',
  ].entries()) {
    add(`pr${i}`, name, 'root-open', 'folder', true)
  }
  add('readme', 'readme.txt', 'root-open', 'file', true)
  add('hs-pr0-cons', '1. Cons', 'pr0', 'folder', true)
  add('hs-pr0', '5. H&S', 'hs-pr0-cons', 'folder', true)

  const children = (parentId: string) =>
    [...nodes.values()].filter(n => n.parentId === parentId)
  const ref = (n: FakeNode): DriveItemRef => ({
    id: n.id,
    name: n.name,
    webUrl: `https://x/${n.id}`,
    eTag: n.eTag,
    ...(n.kind === 'folder' ? { folder: {} } : { file: {} }),
  })
  const walk = (fromId: string, path: string): FakeNode | null => {
    let current = nodes.get(fromId) ?? null
    for (const segment of path.split('/')) {
      if (!current) return null
      current =
        children(current.id).find(
          n => n.name === segment && n.kind === 'folder'
        ) ??
        children(current.id).find(n => n.name === segment) ??
        null
    }
    return current
  }
  const remove = (id: string) => {
    for (const child of children(id)) remove(child.id)
    nodes.delete(id)
  }
  const put = (
    parentId: string,
    fileName: string,
    conflict: ConflictBehavior
  ): FakeNode => {
    writeParents.push(parentId)
    if (!nodes.has(parentId)) throw new GraphError(404, 'itemNotFound')
    const existing = children(parentId).find(n => n.name === fileName)
    if (existing && conflict === 'fail') {
      throw new GraphError(409, 'nameAlreadyExists')
    }
    if (existing && conflict === 'replace') {
      existing.eTag = `e${++seq}`
      return existing
    }
    const name = existing ? `${fileName} (1)` : fileName
    return add(`file-${++seq}`, name, parentId, 'file')
  }

  vi.mocked(getItemByPath).mockImplementation(async (_d, path) => {
    const node = walk('root', path)
    return node ? ref(node) : null
  })
  vi.mocked(getItemByRelativePath).mockImplementation(
    async (_d, base, path) => {
      const node = walk(base, path)
      return node ? ref(node) : null
    }
  )
  vi.mocked(getItem).mockImplementation(async (_d, id) => {
    const node = nodes.get(id)
    return node ? ref(node) : null
  })
  vi.mocked(listChildren).mockImplementation(async (_d, at, opts) => {
    const id = 'itemId' in at ? at.itemId : (walk('root', at.path)?.id ?? '')
    const all = children(id).map(ref)
    if (options.truncateAtTop && opts?.top === options.truncateAtTop) {
      return all.slice(0, 1)
    }
    return all
  })
  vi.mocked(ensureFolder).mockImplementation(async (d, parentId, name) => {
    writeParents.push(parentId)
    const existing = children(parentId).find(n => n.name === name)
    if (existing) return ref(existing)
    const id = name.startsWith('_hs-smoke-') ? `smoke-${d}` : `folder-${++seq}`
    return ref(add(id, name, parentId, 'folder'))
  })
  vi.mocked(putFile).mockImplementation(async input =>
    ref(put(input.parentItemId, input.fileName, input.conflictBehavior))
  )
  vi.mocked(putFileByPath).mockImplementation(async input => {
    const segments = input.path.split('/')
    const fileName = segments.pop() as string
    let parent = 'root'
    for (const segment of segments) {
      const next = children(parent).find(n => n.name === segment)
      if (next) {
        parent = next.id
      } else if (options.autoCreateParents) {
        writeParents.push(parent)
        parent = add(`auto-${++seq}`, segment, parent, 'folder').id
      } else {
        throw new GraphError(404, 'itemNotFound')
      }
    }
    return ref(put(parent, fileName, input.conflictBehavior))
  })
  vi.mocked(renderPdf).mockImplementation(async input => {
    const staged = put(input.staging.parentItemId, input.fileName, 'rename')
    return {
      pdf: Buffer.from('%PDF-1.7'),
      route: 'graph' as const,
      stagedItemId: staged.id,
      elapsedMs: 1234.5,
    }
  })
  vi.mocked(deleteItem).mockImplementation(async (_d, id) => {
    if (!nodes.has(id)) return false
    remove(id)
    return true
  })
  vi.mocked(uploadToSharePoint).mockImplementation(async input => {
    const folder = add(`tk-${++seq}`, input.folderPath, 'root', 'folder')
    add(`tkf-${++seq}`, input.filename, folder.id, 'file')
    return `https://x/${folder.id}`
  })

  return { nodes, preexisting, createdIds, writeParents, children, walk }
}

function baseOptions(extra: Partial<SmokeOptions> = {}): SmokeOptions {
  return { targets, docx, runId: 'RUN1', ...extra }
}

describe('runSmoke tracer (M&E core)', () => {
  let fake: ReturnType<typeof installFakeDrive>

  beforeEach(() => {
    vi.resetAllMocks()
    fake = installFakeDrive()
  })

  it('creates the smoke folder, converts through renderPdf, deletes and confirms 404', async () => {
    const report = await runSmoke(baseOptions())

    expect(smokeFolderName('RUN1')).toBe('_hs-smoke-RUN1')
    expect(getItemByPath).toHaveBeenCalledWith('me-drive', '01_Proj/Open')
    expect(ensureFolder).toHaveBeenCalledWith(
      'me-drive',
      'root-open',
      '_hs-smoke-RUN1'
    )
    expect(renderPdf).toHaveBeenCalledWith({
      docx: docx.bytes,
      fileName: docx.fileName,
      staging: { driveId: 'me-drive', parentItemId: 'smoke-me-drive' },
    })

    const pdf = report.steps.find(s => s.step.includes('convert'))
    expect(pdf?.ok).toBe(true)
    expect(pdf?.detail).toContain('8 bytes')
    expect(pdf?.detail).toContain('1235 ms')
    expect(pdf?.detail).toContain('graph')

    expect(getItem).toHaveBeenCalledWith('me-drive', 'smoke-me-drive')
    expect(report.cleanup.leftovers).toEqual([])
    expect(report.cleanup.deleted).toBeGreaterThanOrEqual(2)
    expect(report.criticalFailure).toBe(false)
    // Everything created by the run is gone, everything else is untouched.
    expect([...fake.nodes.keys()].sort()).toEqual([...fake.preexisting].sort())
  })

  it('records a critical failed step when renderPdf is denied and still cleans up', async () => {
    vi.mocked(renderPdf).mockRejectedValueOnce(
      new GraphError(403, 'accessDenied')
    )

    const report = await runSmoke(baseOptions())

    const pdf = report.steps.find(s => s.step.includes('convert'))
    expect(pdf).toMatchObject({ ok: false, critical: true })
    expect(pdf?.detail).toContain('accessDenied')
    expect(report.criticalFailure).toBe(true)
    expect(fake.nodes.has('smoke-me-drive')).toBe(false)
  })

  it('records a critical failure when the projects root is missing (assumption A1)', async () => {
    vi.mocked(getItemByPath).mockResolvedValueOnce(null)

    const report = await runSmoke(baseOptions())

    expect(report.steps[0]).toMatchObject({
      ok: false,
      critical: true,
      detail: 'projects root not found',
    })
    expect(ensureFolder).not.toHaveBeenCalled()
    expect(report.criticalFailure).toBe(true)
  })

  it('still deletes the smoke folder when an unexpected exception escapes a probe', async () => {
    const log = vi.fn((line: string) => {
      if (line.includes('upload docx')) throw new Error('boom')
    })

    await expect(runSmoke(baseOptions({ log }))).rejects.toThrow('boom')

    expect(fake.nodes.has('smoke-me-drive')).toBe(false)
  })

  it('reports a leftover smoke folder when it still answers after deletion', async () => {
    vi.mocked(deleteItem).mockResolvedValue(false)

    const report = await runSmoke(baseOptions())

    expect(report.cleanup.leftovers).toEqual(['M&E/_hs-smoke-RUN1'])
  })

  it('uses different folder names for two runs without a runId', async () => {
    const a = await runSmoke({ targets, docx })
    const b = await runSmoke({ targets, docx })

    expect(a.runId).not.toBe(b.runId)
    expect(a.runId).toMatch(/^\d{14}-[0-9a-f]{4}$/)
    const names = vi
      .mocked(ensureFolder)
      .mock.calls.map(c => c[2])
      .filter(n => n.startsWith('_hs-smoke-'))
    expect(new Set(names).size).toBe(2)
  })
})

describe('runSmoke names probe and audit (Task 2)', () => {
  let fake: ReturnType<typeof installFakeDrive>

  beforeEach(() => {
    vi.resetAllMocks()
    fake = installFakeDrive()
  })

  it('round-trips the real-style folder name, uploads by id and detects 1. Cons/5. H&S', async () => {
    const report = await runSmoke(baseOptions())

    const names = report.steps.find(s => s.step.includes('real-style'))
    expect(names).toMatchObject({ ok: true, critical: true })
    expect(vi.mocked(ensureFolder).mock.calls.map(c => c[2])).toEqual([
      '_hs-smoke-RUN1',
      PROJECT_NAME,
      '1. Cons',
      '5. H&S',
    ])
    expect(putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'probe.txt',
        conflictBehavior: 'fail',
      })
    )
    const detect = report.steps.find(s => s.step.includes('D-20d'))
    expect(detect).toMatchObject({ ok: true, critical: false })
    expect(detect?.detail).toBe('with chain: found; without chain: null')
    expect(report.criticalFailure).toBe(false)
  })

  it('fails critically when the listing does not return the identical name', async () => {
    vi.mocked(listChildren).mockResolvedValue([
      { id: 'x', name: "PR9999 Test & Co. St. Andrew's Double", webUrl: 'u' },
    ])

    const report = await runSmoke(baseOptions())

    expect(report.steps.find(s => s.step.includes('real-style'))).toMatchObject(
      { ok: false, critical: true }
    )
    expect(report.criticalFailure).toBe(true)
  })

  it('audits PR project folders read-only, never smoke folders or files', async () => {
    const report = await runSmoke(baseOptions({ auditHsFolders: true }))

    // pr0 has the chain; pr1 and pr2 do not.
    expect(report.audit).toEqual({
      withHsFolder: 1,
      withoutHsFolder: ['PR1002 Beta', 'PR1003 Gamma'],
    })
    const auditedBases = vi
      .mocked(getItemByRelativePath)
      .mock.calls.map(c => c[1])
      .filter(base => base.startsWith('pr'))
    expect(auditedBases).toEqual(['pr0', 'pr1', 'pr2'])
    expect(report.steps.at(-1)).toMatchObject({ target: 'Audit', ok: true })

    const md = renderSmokeMarkdown(report)
    expect(md).toContain('1. Cons/5. H&S present: 1 of 3')
    expect(md).toContain('- PR1002 Beta')
  })

  it('makes no write call inside the audit step', async () => {
    await runSmoke(baseOptions({ auditHsFolders: true }))

    // Audit runs last: no write after the final audit lookup.
    const lastLookup = Math.max(
      ...vi
        .mocked(getItemByRelativePath)
        .mock.invocationCallOrder.filter((_, i) =>
          vi.mocked(getItemByRelativePath).mock.calls[i][1].startsWith('pr')
        )
    )
    const writes = [
      ...vi.mocked(ensureFolder).mock.invocationCallOrder,
      ...vi.mocked(putFile).mock.invocationCallOrder,
      ...vi.mocked(putFileByPath).mock.invocationCallOrder,
      ...vi.mocked(renderPdf).mock.invocationCallOrder,
    ]
    expect(writes.every(order => order < lastLookup)).toBe(true)
    expect(fake.preexisting.size).toBeGreaterThan(0)
  })
})

describe('renderSmokeMarkdown', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    installFakeDrive()
  })

  it('prints the table header and a critical failure line', async () => {
    vi.mocked(getItemByPath).mockResolvedValue(null)
    const report = await runSmoke(baseOptions())

    const md = renderSmokeMarkdown(report)

    expect(md).toContain('### Smoke run RUN1')
    expect(md).toContain('| target | step | ok | detail |')
    expect(md).toContain('Critical failure: yes')
  })
})
