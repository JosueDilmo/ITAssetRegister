import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok-abc'),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('uploadToSharePoint', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('constructs the correct Graph URL and returns webUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ webUrl: 'https://company.sharepoint.com/sites/IT/screenshot.png' }),
    })

    const { uploadToSharePoint } = await import('./graphSharePointClient.js')
    const url = await uploadToSharePoint({
      siteId: 'site-123',
      driveId: 'drive-456',
      folderPath: 'IT-Tickets/ticket-uuid',
      filename: 'screenshot.png',
      contentBytes: Buffer.from('fake-image-data').toString('base64'),
      mimeType: 'image/png',
    })

    expect(url).toBe('https://company.sharepoint.com/sites/IT/screenshot.png')
    const [fetchUrl, opts] = mockFetch.mock.calls[0]
    expect(fetchUrl).toContain(
      '/sites/site-123/drives/drive-456/root:/IT-Tickets/ticket-uuid/screenshot.png:/content'
    )
    expect(opts.method).toBe('PUT')
    expect(opts.headers['Content-Type']).toBe('image/png')
    expect(opts.headers['Authorization']).toBe('Bearer tok-abc')
  })

  it('decodes base64 contentBytes correctly in request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ webUrl: 'https://sharepoint.example.com/file.pdf' }),
    })

    const originalContent = 'PDF file content here'
    const base64Content = Buffer.from(originalContent).toString('base64')

    const { uploadToSharePoint } = await import('./graphSharePointClient.js')
    await uploadToSharePoint({
      siteId: 'site-123',
      driveId: 'drive-456',
      folderPath: 'IT-Tickets/ticket-uuid',
      filename: 'doc.pdf',
      contentBytes: base64Content,
      mimeType: 'application/pdf',
    })

    const [, opts] = mockFetch.mock.calls[0]
    expect(Buffer.from(opts.body).toString('utf-8')).toBe(originalContent)
  })

  it('throws when Graph returns non-2xx', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden' })

    const { uploadToSharePoint } = await import('./graphSharePointClient.js')
    await expect(
      uploadToSharePoint({
        siteId: 'site-123',
        driveId: 'drive-456',
        folderPath: 'IT-Tickets/ticket-uuid',
        filename: 'screenshot.png',
        contentBytes: 'aGVsbG8=',
        mimeType: 'image/png',
      })
    ).rejects.toThrow('SharePoint upload failed: 403')
  })
})
