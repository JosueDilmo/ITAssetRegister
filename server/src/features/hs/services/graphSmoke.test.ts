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
  deleteItem,
  ensureFolder,
  getItem,
  getItemByPath,
} from '../../../shared/services/graphDriveClient.js'
import { GraphError } from '../../../shared/services/graphFetch.js'
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

function baseOptions(extra: Partial<SmokeOptions> = {}): SmokeOptions {
  return { targets, docx, runId: 'RUN1', ...extra }
}

function item(id: string, name = id) {
  return { id, name, webUrl: `https://x/${id}` }
}

describe('runSmoke tracer (M&E core)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getItemByPath).mockResolvedValue(item('root-open', 'Open'))
    vi.mocked(ensureFolder).mockResolvedValue({
      ...item('smoke-me'),
      folder: {},
    })
    vi.mocked(renderPdf).mockResolvedValue({
      pdf: Buffer.from('%PDF-1.7'),
      route: 'graph',
      stagedItemId: 'staged-1',
      elapsedMs: 1234.5,
    })
    vi.mocked(deleteItem).mockResolvedValue(true)
    vi.mocked(getItem).mockResolvedValue(null)
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
      staging: { driveId: 'me-drive', parentItemId: 'smoke-me' },
    })

    const pdf = report.steps.find(s => s.step.includes('convert'))
    expect(pdf?.ok).toBe(true)
    expect(pdf?.detail).toContain('8 bytes')
    expect(pdf?.detail).toContain('1235 ms')
    expect(pdf?.detail).toContain('graph')

    const deleted = vi.mocked(deleteItem).mock.calls.map(c => c[1])
    expect(deleted).toEqual(['staged-1', 'smoke-me'])
    expect(getItem).toHaveBeenCalledWith('me-drive', 'smoke-me')
    expect(report.cleanup).toEqual({ deleted: 2, leftovers: [] })
    expect(report.criticalFailure).toBe(false)
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
    expect(vi.mocked(deleteItem).mock.calls.map(c => c[1])).toEqual([
      'smoke-me',
    ])
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

    expect(vi.mocked(deleteItem).mock.calls.map(c => c[1])).toContain(
      'smoke-me'
    )
  })

  it('reports a leftover smoke folder when it still answers after deletion', async () => {
    vi.mocked(getItem).mockResolvedValue({ ...item('smoke-me'), folder: {} })

    const report = await runSmoke(baseOptions())

    expect(report.cleanup.leftovers).toEqual(['M&E/_hs-smoke-RUN1'])
  })

  it('uses different folder names for two runs without a runId', async () => {
    const a = await runSmoke({ targets, docx })
    const b = await runSmoke({ targets, docx })

    expect(a.runId).not.toBe(b.runId)
    expect(a.runId).toMatch(/^\d{14}-[0-9a-f]{4}$/)
    const names = vi.mocked(ensureFolder).mock.calls.map(c => c[2])
    expect(new Set(names).size).toBe(2)
    expect(names.every(n => n.startsWith('_hs-smoke-'))).toBe(true)
  })
})

describe('renderSmokeMarkdown', () => {
  it('prints the table header and a critical failure line', async () => {
    vi.mocked(getItemByPath).mockResolvedValue(null)
    const report = await runSmoke(baseOptions())

    const md = renderSmokeMarkdown(report)

    expect(md).toContain('### Smoke run RUN1')
    expect(md).toContain('| target | step | ok | detail |')
    expect(md).toContain('Critical failure: yes')
  })
})
