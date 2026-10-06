import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  convertToPdf,
  deleteItem,
  encodePath,
  ensureFolder,
  getItem,
  getItemByPath,
  getItemByRelativePath,
  listChildren,
  putFile,
  putFileByPath,
} from './graphDriveClient.js'
import { GraphError } from './graphFetch.js'

const sleep = vi.fn().mockResolvedValue(undefined)

function page(count: number, nextLink?: string, startAt = 0) {
  const value = Array.from({ length: count }, (_, i) => ({
    id: `id${startAt + i}`,
    name: `n${startAt + i}`,
    webUrl: `https://sp/n${startAt + i}`,
  }))
  const body: Record<string, unknown> = { value }
  if (nextLink) body['@odata.nextLink'] = nextLink
  return new Response(JSON.stringify(body), { status: 200 })
}

describe('encodePath', () => {
  it.each([
    [
      'PR1913 EMS - Silver Stream & Trinity Care',
      'PR1913%20EMS%20-%20Silver%20Stream%20%26%20Trinity%20Care',
    ],
    ["PR1983 St. Andrew's", "PR1983%20St.%20Andrew's"],
    [
      'PR1982  DRT DUB 13 Dehumidifiers',
      'PR1982%20%20DRT%20DUB%2013%20Dehumidifiers',
    ],
    ['1. Cons/5. H&S', '1.%20Cons/5.%20H%26S'],
    ['M&E', 'M%26E'],
  ])('encodes %s', (input, expected) => {
    expect(encodePath(input)).toBe(expected)
  })

  it.each(['', 'a//b', '/a', 'a/'])('rejects %j', input => {
    expect(() => encodePath(input)).toThrow('empty path segment')
  })
})

describe('listChildren', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    sleep.mockClear()
  })

  it('follows @odata.nextLink verbatim and returns all 250 children across two pages', async () => {
    const next =
      'https://graph.microsoft.com/v1.0/drives/d/items/i1/children?$skiptoken=abc'
    mockFetch
      .mockResolvedValueOnce(page(200, next))
      .mockResolvedValueOnce(page(50, undefined, 200))
    const items = await listChildren('d', { itemId: 'i1' }, { sleep })
    expect(items).toHaveLength(250)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    const firstUrl = mockFetch.mock.calls[0][0] as string
    expect(firstUrl).toContain('$select=id,name,webUrl,folder,file')
    expect(firstUrl).toContain('$top=200')
    expect(mockFetch.mock.calls[1][0]).toBe(next)
  })

  it('costs one request for exactly 200 children without nextLink', async () => {
    mockFetch.mockResolvedValueOnce(page(200))
    const items = await listChildren('d', { itemId: 'i1' }, { sleep })
    expect(items).toHaveLength(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('costs two requests for 201 children', async () => {
    const next =
      'https://graph.microsoft.com/v1.0/drives/d/items/i1/children?$skiptoken=abc'
    mockFetch
      .mockResolvedValueOnce(page(200, next))
      .mockResolvedValueOnce(page(1, undefined, 200))
    const items = await listChildren('d', { itemId: 'i1' }, { sleep })
    expect(items).toHaveLength(201)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('refuses a nextLink on another origin and never fetches it', async () => {
    mockFetch.mockResolvedValueOnce(page(1, 'https://evil.example/next'))
    await expect(
      listChildren('d', { itemId: 'i1' }, { sleep })
    ).rejects.toThrow('refusing non-Graph URL')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls.map(c => c[0])).not.toContain(
      'https://evil.example/next'
    )
  })

  it('throws when the page guard is exceeded', async () => {
    const next =
      'https://graph.microsoft.com/v1.0/drives/d/items/i1/children?$skiptoken=abc'
    mockFetch.mockImplementation(async () => page(1, next))
    await expect(
      listChildren('d', { itemId: 'i1' }, { sleep, maxPages: 3 })
    ).rejects.toThrow('page guard exceeded')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('returns [] for an empty value array', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ value: [] }), { status: 200 })
    )
    expect(await listChildren('d', { itemId: 'i1' }, { sleep })).toEqual([])
  })

  it('returns [] when the page has no value array', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    )
    expect(await listChildren('d', { itemId: 'i1' }, { sleep })).toEqual([])
  })

  it('addresses a path under the drive root', async () => {
    mockFetch.mockResolvedValueOnce(page(0))
    await listChildren('d', { path: '01_Proj/Open' }, { sleep })
    expect(mockFetch.mock.calls[0][0]).toContain(
      '/drives/d/root:/01_Proj/Open:/children'
    )
  })

  it('addresses an item id', async () => {
    mockFetch.mockResolvedValueOnce(page(0))
    await listChildren('d', { itemId: 'i1' }, { sleep })
    expect(mockFetch.mock.calls[0][0]).toContain('/drives/d/items/i1/children')
  })

  it('rejects an empty path before any request', async () => {
    await expect(listChildren('d', { path: '' }, { sleep })).rejects.toThrow(
      'empty path segment'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

function item(over: Record<string, unknown> = {}) {
  return { id: 'i1', name: 'n', webUrl: 'https://sp/n', eTag: 'e1', ...over }
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function graphErr(status: number, code: string) {
  return jsonRes({ error: { code, message: 'm' } }, status)
}

describe('item lookups', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('getItemByRelativePath encodes the relative path and returns the item', async () => {
    mockFetch.mockResolvedValueOnce(jsonRes(item()))
    const found = await getItemByRelativePath('d', 'p1', '1. Cons/5. H&S', {
      sleep,
    })
    expect(found?.id).toBe('i1')
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('/drives/d/items/p1:/1.%20Cons/5.%20H%26S')
    expect(url).toContain('$select=')
  })

  it('getItemByRelativePath returns null on 404 and throws on 500', async () => {
    mockFetch.mockResolvedValueOnce(graphErr(404, 'itemNotFound'))
    expect(await getItemByRelativePath('d', 'p1', 'x', { sleep })).toBeNull()
    mockFetch.mockResolvedValueOnce(graphErr(500, 'generalException'))
    await expect(
      getItemByRelativePath('d', 'p1', 'x', { sleep })
    ).rejects.toBeInstanceOf(GraphError)
  })

  it('getItemByPath addresses the drive root and returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonRes(item()))
    await getItemByPath('d', '01_Proj/Open', { sleep })
    expect(mockFetch.mock.calls[0][0]).toContain('/drives/d/root:/01_Proj/Open')
    mockFetch.mockResolvedValueOnce(graphErr(404, 'itemNotFound'))
    expect(await getItemByPath('d', '01_Proj/Open', { sleep })).toBeNull()
  })

  it('getItem returns the item and null on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonRes(item()))
    expect((await getItem('d', 'i1', { sleep }))?.id).toBe('i1')
    expect(mockFetch.mock.calls[0][0]).toContain('/drives/d/items/i1?')
    mockFetch.mockResolvedValueOnce(graphErr(404, 'itemNotFound'))
    expect(await getItem('d', 'i1', { sleep })).toBeNull()
  })
})

describe('ensureFolder', () => {
  const NAME = "PR9999 Test & Co. St. Andrew's  Double"

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('POSTs a fail-on-conflict folder create under the parent item id', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonRes(item({ id: 'f1', name: NAME, folder: {} }), 201)
    )
    const created = await ensureFolder('d', 'p1', NAME, { sleep })
    expect(created.id).toBe('f1')
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe(
      'https://graph.microsoft.com/v1.0/drives/d/items/p1/children'
    )
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('content-type')).toBe(
      'application/json'
    )
    expect(JSON.parse(init.body)).toEqual({
      name: NAME,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    })
  })

  it('is idempotent: a 409 falls back to the existing folder, same id both times', async () => {
    const existing = item({ id: 'f1', name: NAME, folder: {} })
    mockFetch
      .mockResolvedValueOnce(graphErr(409, 'nameAlreadyExists'))
      .mockResolvedValueOnce(jsonRes(existing))
      .mockResolvedValueOnce(graphErr(409, 'nameAlreadyExists'))
      .mockResolvedValueOnce(jsonRes(existing))
    const a = await ensureFolder('d', 'p1', NAME, { sleep })
    const b = await ensureFolder('d', 'p1', NAME, { sleep })
    expect(a.id).toBe('f1')
    expect(b.id).toBe(a.id)
    expect(mockFetch.mock.calls[1][0]).toContain('/drives/d/items/p1:/')
  })

  it('throws when the 409 name is held by a file, not a folder', async () => {
    mockFetch
      .mockResolvedValueOnce(graphErr(409, 'nameAlreadyExists'))
      .mockResolvedValueOnce(jsonRes(item({ file: {} })))
    await expect(ensureFolder('d', 'p1', 'x', { sleep })).rejects.toThrow()
  })

  it('throws when the 409 lookup finds nothing', async () => {
    mockFetch
      .mockResolvedValueOnce(graphErr(409, 'nameAlreadyExists'))
      .mockResolvedValueOnce(graphErr(404, 'itemNotFound'))
    await expect(ensureFolder('d', 'p1', 'x', { sleep })).rejects.toThrow()
  })

  it.each(['', 'a/b', 'x.', '~x', 'a#b', 'a%b', 'a:b', ' x', 'x '])(
    'rejects invalid name %j before any fetch',
    async name => {
      await expect(ensureFolder('d', 'p1', name, { sleep })).rejects.toThrow(
        'Invalid SharePoint item name'
      )
      await expect(
        putFile(
          {
            driveId: 'd',
            parentItemId: 'p1',
            fileName: name,
            content: Buffer.from('x'),
            contentType: 'text/plain',
            conflictBehavior: 'fail',
          },
          { sleep }
        )
      ).rejects.toThrow('Invalid SharePoint item name')
      expect(mockFetch).not.toHaveBeenCalled()
    }
  )
})

describe('putFile', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  const content = Buffer.from('docx-bytes')

  it('PUTs the encoded file name under the parent with explicit conflict behaviour', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonRes(item({ id: 'u1', name: "PR1983 St. Andrew's.docx" }))
    )
    const out = await putFile(
      {
        driveId: 'd',
        parentItemId: 'p1',
        fileName: "PR1983 St. Andrew's.docx",
        content,
        contentType: 'application/x-test',
        conflictBehavior: 'fail',
      },
      { sleep }
    )
    expect(out).toMatchObject({ id: 'u1', webUrl: 'https://sp/n', eTag: 'e1' })
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe(
      "https://graph.microsoft.com/v1.0/drives/d/items/p1:/PR1983%20St.%20Andrew's.docx:/content?@microsoft.graph.conflictBehavior=fail"
    )
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(content)
    expect(new Headers(init.headers).get('content-type')).toBe(
      'application/x-test'
    )
  })

  it('throws GraphError 409 when conflictBehavior is fail and the name exists', async () => {
    mockFetch.mockResolvedValueOnce(graphErr(409, 'nameAlreadyExists'))
    const err = await putFile(
      {
        driveId: 'd',
        parentItemId: 'p1',
        fileName: 'a.docx',
        content,
        contentType: 'x/y',
        conflictBehavior: 'fail',
      },
      { sleep }
    ).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.status).toBe(409)
  })

  it('putFileByPath PUTs under the drive root with the chosen conflict behaviour', async () => {
    mockFetch.mockResolvedValueOnce(jsonRes(item()))
    await putFileByPath(
      {
        driveId: 'd',
        path: 'Proj A/new folder/a & b.docx',
        content,
        contentType: 'x/y',
        conflictBehavior: 'rename',
      },
      { sleep }
    )
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://graph.microsoft.com/v1.0/drives/d/root:/Proj%20A/new%20folder/a%20%26%20b.docx:/content?@microsoft.graph.conflictBehavior=rename'
    )
  })
})

describe('deleteItem', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns true on 204', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    expect(await deleteItem('d', 'i1', { sleep })).toBe(true)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://graph.microsoft.com/v1.0/drives/d/items/i1')
    expect(init.method).toBe('DELETE')
  })

  it('returns false on 404', async () => {
    mockFetch.mockResolvedValueOnce(graphErr(404, 'itemNotFound'))
    expect(await deleteItem('d', 'i1', { sleep })).toBe(false)
  })
})

describe('convertToPdf', () => {
  const PDF_URL =
    'https://graph.microsoft.com/v1.0/drives/d/items/i1/content?format=pdf'
  const LOCATION = 'https://masterair-my.sharepoint.com/x.pdf'

  beforeEach(() => {
    mockFetch.mockReset()
  })

  function redirect(location?: string, status = 302) {
    return new Response(null, {
      status,
      headers: location ? { location } : {},
    })
  }

  it('requests ?format=pdf with redirect manual, then fetches the Location with no headers', async () => {
    mockFetch
      .mockResolvedValueOnce(redirect(LOCATION))
      .mockResolvedValueOnce(new Response('%PDF-1.7 body', { status: 200 }))
    const out = await convertToPdf('d', 'i1', { sleep })
    expect(out.viaRedirect).toBe(true)
    expect(out.pdf.subarray(0, 4).toString('latin1')).toBe('%PDF')
    expect(out.elapsedMs).toBeGreaterThanOrEqual(0)

    const [firstUrl, firstInit] = mockFetch.mock.calls[0]
    expect(firstUrl).toBe(PDF_URL)
    expect(firstInit.redirect).toBe('manual')

    const [secondUrl, secondInit] = mockFetch.mock.calls[1]
    expect(secondUrl).toBe(LOCATION)
    expect(secondInit.headers).toBeUndefined()
    expect(JSON.stringify(secondInit)).not.toMatch(/authorization|bearer/i)
  })

  it('accepts a direct 200 PDF body', async () => {
    mockFetch.mockResolvedValueOnce(new Response('%PDF-1.4 x', { status: 200 }))
    const out = await convertToPdf('d', 'i1', { sleep })
    expect(out.viaRedirect).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a zip (PK) body', 'PK\u0003\u0004zip'],
    ['an empty body', ''],
  ])('throws invalidPdf for %s', async (_label, body) => {
    mockFetch.mockResolvedValueOnce(new Response(body, { status: 200 }))
    const err = await convertToPdf('d', 'i1', { sleep }).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.code).toBe('invalidPdf')
  })

  it('throws invalidPdf when the redirected body is not a PDF', async () => {
    mockFetch
      .mockResolvedValueOnce(redirect(LOCATION))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
    const err = await convertToPdf('d', 'i1', { sleep }).catch(e => e)
    expect(err.code).toBe('invalidPdf')
  })

  it('refuses a non-https Location without fetching it', async () => {
    mockFetch.mockResolvedValueOnce(
      redirect('http://masterair-my.sharepoint.com/x.pdf')
    )
    await expect(convertToPdf('d', 'i1', { sleep })).rejects.toThrow()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws on a redirect without Location', async () => {
    mockFetch.mockResolvedValueOnce(redirect(undefined))
    await expect(convertToPdf('d', 'i1', { sleep })).rejects.toThrow()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws when the Location fetch is not ok', async () => {
    mockFetch
      .mockResolvedValueOnce(redirect(LOCATION))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
    await expect(convertToPdf('d', 'i1', { sleep })).rejects.toThrow()
  })

  it('surfaces a 403 as GraphError status 403 for the D-12 fallback decision', async () => {
    mockFetch.mockResolvedValueOnce(graphErr(403, 'accessDenied'))
    const err = await convertToPdf('d', 'i1', { sleep }).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.status).toBe(403)
    expect(err.code).toBe('accessDenied')
  })
})
