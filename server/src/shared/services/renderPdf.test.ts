import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))

vi.mock('./graphDriveClient.js', () => ({
  putFile: vi.fn(),
  convertToPdf: vi.fn(),
}))

import { convertToPdf, putFile } from './graphDriveClient.js'
import { GraphError } from './graphFetch.js'
import { DOCX_MIME, renderPdf } from './renderPdf.js'

const docx = Buffer.from('docx')
const staging = { driveId: 'd', parentItemId: 'p' }

describe('renderPdf', () => {
  beforeEach(() => {
    vi.mocked(putFile).mockReset()
    vi.mocked(convertToPdf).mockReset()
  })

  it('stages the docx with rename conflict behaviour then converts it through Graph', async () => {
    vi.mocked(putFile).mockResolvedValueOnce({
      id: 'staged1',
      name: 'probe.docx',
      webUrl: 'u',
    })
    const pdf = Buffer.from('%PDF-1.7')
    vi.mocked(convertToPdf).mockResolvedValueOnce({
      pdf,
      viaRedirect: true,
      elapsedMs: 5,
    })

    const out = await renderPdf({ docx, fileName: 'probe.docx', staging })

    expect(putFile).toHaveBeenCalledWith(
      {
        driveId: 'd',
        parentItemId: 'p',
        fileName: 'probe.docx',
        content: docx,
        contentType: DOCX_MIME,
        conflictBehavior: 'rename',
      },
      undefined
    )
    expect(convertToPdf).toHaveBeenCalledWith('d', 'staged1', undefined)
    expect(out.pdf).toBe(pdf)
    expect(out.route).toBe('graph')
    expect(out.stagedItemId).toBe('staged1')
    expect(out.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  it('passes options through to both steps', async () => {
    const opts = { maxRetries: 1 }
    vi.mocked(putFile).mockResolvedValueOnce({
      id: 's',
      name: 'n',
      webUrl: 'u',
    })
    vi.mocked(convertToPdf).mockResolvedValueOnce({
      pdf: Buffer.from('%PDF'),
      viaRedirect: false,
      elapsedMs: 1,
    })
    await renderPdf({ docx, fileName: 'a.docx', staging }, opts)
    expect(vi.mocked(putFile).mock.calls[0][1]).toBe(opts)
    expect(vi.mocked(convertToPdf).mock.calls[0][2]).toBe(opts)
  })

  it('propagates a GraphError from the upload unchanged', async () => {
    const err = new GraphError(409, 'nameAlreadyExists')
    vi.mocked(putFile).mockRejectedValueOnce(err)
    await expect(renderPdf({ docx, fileName: 'a.docx', staging })).rejects.toBe(
      err
    )
    expect(convertToPdf).not.toHaveBeenCalled()
  })

  it('propagates a GraphError from the conversion unchanged', async () => {
    const err = new GraphError(403, 'accessDenied')
    vi.mocked(putFile).mockResolvedValueOnce({
      id: 's',
      name: 'n',
      webUrl: 'u',
    })
    vi.mocked(convertToPdf).mockRejectedValueOnce(err)
    await expect(renderPdf({ docx, fileName: 'a.docx', staging })).rejects.toBe(
      err
    )
  })
})
