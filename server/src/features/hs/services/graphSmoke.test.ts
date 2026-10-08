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

import { getGraphAccessToken } from '../../../shared/services/graphAuth.js'
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
  decodeTokenRoles,
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

const FAKE_SIGNATURE = 'SECRET-SIGNATURE-MUST-NOT-LEAK'

function fakeJwt(roles: string[]): string {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'RS256' })}.${part({ roles })}.${FAKE_SIGNATURE}`
}

interface FakeNode {
  id: string
  name: string
  parentId: string | null
  kind: 'file' | 'folder'
  eTag: string
}

/** In-memory drive standing in for every mocked Graph call. */
function installFakeDrive(
  options: {
    autoCreateParents?: boolean
    truncateAtTop?: number
    roles?: string[]
  } = {}
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
  const drives = ['me-drive', 'pre-drive', 'ctl-drive', 'tk-drive']
  for (const d of drives) add(`root:${d}`, '', null, 'folder', true)
  // 'root' is the Graph alias for a drive's root folder.
  const norm = (driveId: string, id: string) =>
    id === 'root' ? `root:${driveId}` : id
  add('proj', '01_Proj', 'root:me-drive', 'folder', true)
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

  vi.mocked(getItemByPath).mockImplementation(async (d, path) => {
    const node = walk(`root:${d}`, path)
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
  vi.mocked(listChildren).mockImplementation(async (d, at, opts) => {
    const id =
      'itemId' in at
        ? norm(d, at.itemId)
        : (walk(`root:${d}`, at.path)?.id ?? '')
    const all = children(id).map(ref)
    if (options.truncateAtTop && opts?.top === options.truncateAtTop) {
      return all.slice(0, 1)
    }
    return all
  })
  vi.mocked(ensureFolder).mockImplementation(async (d, rawParent, name) => {
    const parentId = norm(d, rawParent)
    writeParents.push(parentId)
    const existing = children(parentId).find(n => n.name === name)
    if (existing) return ref(existing)
    const id = name.startsWith('_hs-smoke-') ? `smoke-${d}` : `folder-${++seq}`
    return ref(add(id, name, parentId, 'folder'))
  })
  vi.mocked(putFile).mockImplementation(async input =>
    ref(
      put(
        norm(input.driveId, input.parentItemId),
        input.fileName,
        input.conflictBehavior
      )
    )
  )
  vi.mocked(putFileByPath).mockImplementation(async input => {
    const segments = input.path.split('/')
    const fileName = segments.pop() as string
    let parent = `root:${input.driveId}`
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
    const folder = add(
      `tk-${++seq}`,
      input.folderPath,
      `root:${input.driveId}`,
      'folder'
    )
    add(`tkf-${++seq}`, input.filename, folder.id, 'file')
    return `https://x/${folder.id}`
  })

  vi.mocked(getGraphAccessToken).mockResolvedValue(
    fakeJwt(options.roles ?? ['Sites.Selected'])
  )

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

    expect(
      report.steps.find(s => s.step === 'resolve projects root')
    ).toMatchObject({
      ok: false,
      critical: true,
      detail: 'projects root not found',
    })
    expect(
      vi.mocked(ensureFolder).mock.calls.some(c => c[0] === 'me-drive')
    ).toBe(false)
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

    expect(report.cleanup.leftovers).toContain('M&E/_hs-smoke-RUN1')
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
    const meFolders = vi
      .mocked(ensureFolder)
      .mock.calls.filter(c => c[0] === 'me-drive')
      .map(c => c[2])
    expect(meFolders).toEqual([
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

describe('runSmoke spike probes (Task 3)', () => {
  let fake: ReturnType<typeof installFakeDrive>

  beforeEach(() => {
    vi.resetAllMocks()
    fake = installFakeDrive({ autoCreateParents: true })
  })

  const row = (report: { steps: { step: string }[] }, text: string) =>
    report.steps.find(s => s.step.includes(text)) as
      | {
          target: string
          step: string
          ok: boolean
          critical: boolean
          detail: string
        }
      | undefined

  it('decodes role claim names and tolerates a malformed token', () => {
    expect(decodeTokenRoles(fakeJwt(['A.Read', 'B.Write']))).toEqual([
      'A.Read',
      'B.Write',
    ])
    expect(decodeTokenRoles('not-a-jwt')).toEqual([])
    expect(decodeTokenRoles('a.!!!.c')).toEqual([])
    expect(decodeTokenRoles('')).toEqual([])
  })

  it('never lets the token or its signature reach the markdown, logs or step details', async () => {
    const token = fakeJwt(['Sites.Selected'])
    const log = vi.fn()

    const report = await runSmoke(baseOptions({ log }))
    const md = renderSmokeMarkdown(report)

    expect(report.tokenRoles).toEqual(['Sites.Selected'])
    expect(md).toContain('Token roles: Sites.Selected')
    const everything = `${md}\n${log.mock.calls.flat().join('\n')}\n${JSON.stringify(report)}`
    expect(everything).not.toContain(token)
    expect(everything).not.toContain(FAKE_SIGNATURE)
  })

  it('marks a critical failure for broad scopes only with expectSelectedOnly', async () => {
    fake = installFakeDrive({
      roles: ['Files.ReadWrite.All', 'Sites.Selected'],
    })

    const strict = await runSmoke(baseOptions({ expectSelectedOnly: true }))
    expect(row(strict, 'token roles')).toMatchObject({
      ok: false,
      critical: true,
    })
    expect(row(strict, 'token roles')?.detail).toContain('Files.ReadWrite.All')
    expect(strict.criticalFailure).toBe(true)

    const lax = await runSmoke(baseOptions())
    expect(row(lax, 'token roles')?.ok).toBe(true)
    expect(lax.criticalFailure).toBe(false)
  })

  it('passes expectSelectedOnly when only Sites.Selected is present', async () => {
    const report = await runSmoke(baseOptions({ expectSelectedOnly: true }))

    expect(row(report, 'token roles')?.ok).toBe(true)
    expect(report.criticalFailure).toBe(false)
  })

  it('proves paging: equal counts at $top 200 and 20 pass, different counts fail critically', async () => {
    const ok = await runSmoke(baseOptions())
    expect(row(ok, 'paging proof')).toMatchObject({ ok: true, critical: true })
    expect(row(ok, 'paging proof')?.detail).toBe(
      '4 children at both page sizes'
    )
    const tops = vi
      .mocked(listChildren)
      .mock.calls.map(c => c[2]?.top)
      .filter(Boolean)
    expect(tops).toContain(200)
    expect(tops).toContain(20)

    fake = installFakeDrive({ truncateAtTop: 20 })
    const bad = await runSmoke(baseOptions())
    expect(row(bad, 'paging proof')).toMatchObject({
      ok: false,
      critical: true,
    })
    expect(bad.criticalFailure).toBe(true)
  })

  it('records $top=999 acceptance as informational only', async () => {
    const impl = vi.mocked(listChildren).getMockImplementation()
    vi.mocked(listChildren).mockImplementation(async (d, at, opts) => {
      if (opts?.top === 999) throw new GraphError(400, 'invalidRequest')
      return (impl as NonNullable<typeof impl>)(d, at, opts)
    })

    const report = await runSmoke(baseOptions())

    expect(row(report, '$top=999')).toMatchObject({
      ok: false,
      critical: false,
    })
    expect(report.criticalFailure).toBe(false)
  })

  it('records whether a path PUT auto-creates parent folders', async () => {
    const yes = await runSmoke(baseOptions())
    expect(putFileByPath).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '01_Proj/Open/_hs-smoke-RUN1/a/b/probe.txt',
        conflictBehavior: 'fail',
      })
    )
    expect(row(yes, 'auto-create')).toMatchObject({ ok: true, critical: false })
    expect(row(yes, 'auto-create')?.detail).toBe(
      'parents auto-created: a yes, a/b yes'
    )
    expect(yes.cleanup.leftovers).toEqual([])

    fake = installFakeDrive({ autoCreateParents: false })
    const no = await runSmoke(baseOptions())
    expect(row(no, 'auto-create')).toMatchObject({ ok: false, critical: false })
    expect(row(no, 'auto-create')?.detail).toContain('not auto-created')
    expect(no.criticalFailure).toBe(false)
  })

  it('records fail, fail again (409), replace and rename outcomes on one name', async () => {
    const report = await runSmoke(baseOptions())

    const conflictCalls = vi
      .mocked(putFile)
      .mock.calls.filter(c => c[0].fileName === 'conflict.txt')
      .map(c => c[0].conflictBehavior)
    expect(conflictCalls).toEqual(['fail', 'fail', 'replace', 'rename'])
    expect(row(report, 'conflict fail: first')?.ok).toBe(true)
    expect(row(report, 'conflict fail: second')).toMatchObject({
      ok: true,
      detail: '409 nameAlreadyExists (expected)',
    })
    expect(row(report, 'conflict replace')).toMatchObject({
      ok: true,
      detail: 'id same, eTag changed',
    })
    expect(row(report, 'conflict rename')).toMatchObject({
      ok: true,
      detail: 'stored as conflict.txt (1)',
    })
    expect(
      report.steps.filter(s => s.step.includes('conflict')).map(s => s.critical)
    ).toEqual([false, false, false, false])
  })

  it('probes QHSE Pre-approved with a project-code subfolder, staged PDF and replace evidence', async () => {
    const report = await runSmoke(baseOptions())

    expect(ensureFolder).toHaveBeenCalledWith(
      'pre-drive',
      'root',
      '_hs-smoke-RUN1'
    )
    expect(ensureFolder).toHaveBeenCalledWith(
      'pre-drive',
      'smoke-pre-drive',
      'PR9999'
    )
    expect(renderPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        staging: expect.objectContaining({ driveId: 'pre-drive' }),
      })
    )
    const preRows = report.steps.filter(s => s.target === 'QHSE Pre-approved')
    expect(preRows.map(r => r.step)).toEqual([
      'resolve library root',
      'create smoke folder',
      'per-project subfolder named by project code (D-19)',
      'upload docx and convert to PDF',
      'replace staged docx (sensitivity label check)',
    ])
    expect(preRows.every(r => r.ok)).toBe(true)
    expect(preRows[3].critical).toBe(true)
    expect(putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        driveId: 'pre-drive',
        fileName: docx.fileName,
        conflictBehavior: 'replace',
      })
    )
  })

  it('resolves a non-empty library root by path and fails critically when it is missing', async () => {
    const report = await runSmoke({
      targets: {
        ...targets,
        qhse: {
          ...targets.qhse,
          preapproved: { driveId: 'pre-drive', root: 'Pre-approved docs' },
        },
      },
      docx,
      runId: 'RUN1',
    })

    expect(getItemByPath).toHaveBeenCalledWith('pre-drive', 'Pre-approved docs')
    const resolve = report.steps.find(
      s => s.target === 'QHSE Pre-approved' && s.step === 'resolve library root'
    )
    expect(resolve).toMatchObject({ ok: false, critical: true })
    expect(report.criticalFailure).toBe(true)
    expect(
      report.steps.some(
        s =>
          s.step === 'create smoke folder' && s.target === 'QHSE Pre-approved'
      )
    ).toBe(false)
  })

  it('probes QHSE Control with a probe file that must not overwrite (fail)', async () => {
    const report = await runSmoke(baseOptions())

    expect(putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        driveId: 'ctl-drive',
        parentItemId: 'smoke-ctl-drive',
        fileName: 'probe.txt',
        conflictBehavior: 'fail',
      })
    )
    const ctlRows = report.steps.filter(s => s.target === 'QHSE Control')
    expect(ctlRows.length).toBe(3)
    expect(ctlRows.every(r => r.ok)).toBe(true)
    expect(ctlRows[2].critical).toBe(true)
  })

  it('probes tickets through the unchanged uploadToSharePoint path and cleans the folder', async () => {
    const report = await runSmoke(
      baseOptions({ tickets: { siteId: 'tk-site', driveId: 'tk-drive' } })
    )

    expect(uploadToSharePoint).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'tk-site',
        driveId: 'tk-drive',
        folderPath: smokeFolderName('RUN1'),
        mimeType: 'text/plain',
      })
    )
    expect(row(report, 'uploadToSharePoint')).toMatchObject({
      target: 'Tickets',
      ok: true,
      critical: true,
    })
    expect(report.cleanup.leftovers).toEqual([])
    expect([...fake.nodes.keys()].sort()).toEqual([...fake.preexisting].sort())
  })

  it('does not touch tickets unless the probe is requested, and reports a denied upload', async () => {
    await runSmoke(baseOptions())
    expect(uploadToSharePoint).not.toHaveBeenCalled()

    vi.mocked(uploadToSharePoint).mockRejectedValueOnce(
      new Error('SharePoint upload failed: 403 accessDenied')
    )
    const report = await runSmoke(
      baseOptions({ tickets: { siteId: 'tk-site', driveId: 'tk-drive' } })
    )
    expect(row(report, 'uploadToSharePoint')).toMatchObject({
      ok: false,
      critical: true,
    })
    expect(row(report, 'uploadToSharePoint')?.detail).toContain('403')
    expect(report.criticalFailure).toBe(true)
  })

  it('reports rows in the fixed order token, M&E, QHSE Pre-approved, QHSE Control, Tickets, Audit', async () => {
    const report = await runSmoke(
      baseOptions({
        auditHsFolders: true,
        tickets: { siteId: 'tk-site', driveId: 'tk-drive' },
      })
    )

    const order = [
      'Token',
      'M&E',
      'QHSE Pre-approved',
      'QHSE Control',
      'Tickets',
      'Audit',
    ]
    const seen = report.steps
      .map(s => s.target)
      .filter((t, i, all) => all.indexOf(t) === i)
    expect(seen).toEqual(order)
    const indexes = report.steps.map(s => order.indexOf(s.target))
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes)
    expect(report.criticalFailure).toBe(false)
  })

  it('writes only inside this run: containers get the smoke folder, everything else is a created id, deletes hit created ids only', async () => {
    const containers = new Set([
      'root-open',
      'root:pre-drive',
      'root:ctl-drive',
    ])

    await runSmoke(
      baseOptions({
        auditHsFolders: true,
        tickets: { siteId: 'tk-site', driveId: 'tk-drive' },
      })
    )

    for (const [d, rawParent, name] of vi.mocked(ensureFolder).mock.calls) {
      const parent = rawParent === 'root' ? `root:${d}` : rawParent
      if (containers.has(parent)) {
        expect(name).toBe('_hs-smoke-RUN1')
      } else {
        expect(fake.createdIds.has(parent)).toBe(true)
      }
    }
    for (const [input] of vi.mocked(putFile).mock.calls) {
      expect(fake.createdIds.has(input.parentItemId)).toBe(true)
    }
    for (const [input] of vi.mocked(renderPdf).mock.calls) {
      expect(fake.createdIds.has(input.staging.parentItemId)).toBe(true)
    }
    for (const [input] of vi.mocked(putFileByPath).mock.calls) {
      expect(input.path.startsWith('01_Proj/Open/_hs-smoke-RUN1/')).toBe(true)
    }
    for (const [, itemId] of vi.mocked(deleteItem).mock.calls) {
      expect(fake.createdIds.has(itemId)).toBe(true)
    }
    for (const id of fake.preexisting) expect(fake.nodes.has(id)).toBe(true)
  })

  it('stops probing when aborted mid-run and still cleans up', async () => {
    const controller = new AbortController()
    const impl = vi.mocked(renderPdf).getMockImplementation()
    vi.mocked(renderPdf).mockImplementation(async input => {
      controller.abort()
      return (impl as NonNullable<typeof impl>)(input)
    })

    const report = await runSmoke(baseOptions({ signal: controller.signal }))

    expect(report.steps.some(s => s.target === 'QHSE Pre-approved')).toBe(false)
    expect(report.steps.some(s => s.step.includes('real-style'))).toBe(false)
    expect(report.cleanup.leftovers).toEqual([])
    expect([...fake.nodes.keys()].sort()).toEqual([...fake.preexisting].sort())
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
