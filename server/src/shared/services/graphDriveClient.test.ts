import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { encodePath, listChildren } from './graphDriveClient.js'

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
