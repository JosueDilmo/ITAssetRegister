import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({ db: { select: vi.fn() } }))

// Recording eq() so the tests can assert which email value the asset and
// licence filters were built with. The real sql template is kept.
vi.mock('drizzle-orm', async importOriginal => ({
  ...(await importOriginal<typeof import('drizzle-orm')>()),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}))

// biome-ignore lint/suspicious/noExplicitAny: test mock row
type Row = Record<string, any>

// Each db.select() call consumes the next queued result. The `where` result is
// awaitable (asset and licence queries) and also exposes `.limit` (staff lookup).
function queueSelects(results: Row[][]) {
  return vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => {
        const rows = results.shift() ?? []
        return Object.assign(Promise.resolve(rows), {
          limit: vi.fn().mockResolvedValue(rows),
        })
      }),
    }),
  }))
}

const staffRow = {
  name: 'Jane Doe',
  email: 'jane@mastertech.ie',
  department: 'Engineering',
  jobTitle: 'Developer',
  status: 'ACTIVE',
}

const assetRow = (assetNumber: string) => ({
  id: '22222222-2222-4222-8222-222222222222',
  assetNumber,
  type: 'Laptop',
  maker: 'Dell',
  name: 'Latitude 7440',
  serialNumber: `SN-${assetNumber}`,
})

const licenceRow = (licenceNumber: string) => ({
  id: 'da06fb97-eefc-4e6a-a2ca-94bfaa85d841',
  licenceNumber,
  name: 'ADOBE ACROBAT PRO',
  licenceType: 'SUBSCRIPTION',
  expiryDate: null,
})

async function setup(results: Row[][]) {
  const { db } = await import('../../../drizzle/client.js')
  const selectMock = queueSelects(results)
  // biome-ignore lint/suspicious/noExplicitAny: mocked select
  ;(db.select as any) = selectMock
  const { eq } = await import('drizzle-orm')
  const { getMe } = await import('./getMe.js')
  return { selectMock, eqMock: vi.mocked(eq), getMe }
}

describe('getMe', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('matches the staff row case-insensitively and filters holdings on the stored email', async () => {
    const { eqMock, getMe } = await setup([
      [staffRow],
      [assetRow('IT-0001')],
      [licenceRow('LIC-0001')],
    ])

    const result = await getMe({ email: 'Jane@MasterTech.ie' })

    expect(result.staff).toEqual(staffRow)
    expect(eqMock).toHaveBeenCalledTimes(2)
    expect(eqMock.mock.calls.map(call => call[1])).toEqual([
      'jane@mastertech.ie',
      'jane@mastertech.ie',
    ])
  })

  it('returns staff null and empty lists, with a single select, when there is no staff record', async () => {
    const { selectMock, getMe } = await setup([[]])

    const result = await getMe({ email: 'nobody@mastertech.ie' })

    expect(result).toEqual({ staff: null, assets: [], licences: [] })
    expect(selectMock).toHaveBeenCalledTimes(1)
  })

  it('selects only the allowlisted columns for staff, assets and licences', async () => {
    const { selectMock, getMe } = await setup([[staffRow], [], []])

    await getMe({ email: staffRow.email })

    expect(selectMock).toHaveBeenCalledTimes(3)
    expect(Object.keys(selectMock.mock.calls[0][0])).toEqual([
      'name',
      'email',
      'department',
      'jobTitle',
      'status',
    ])
    expect(Object.keys(selectMock.mock.calls[1][0])).toEqual([
      'id',
      'assetNumber',
      'type',
      'maker',
      'name',
      'serialNumber',
    ])
    expect(Object.keys(selectMock.mock.calls[2][0])).toEqual([
      'id',
      'licenceNumber',
      'name',
      'licenceType',
      'expiryDate',
    ])
  })

  it('sorts assets by assetNumber and licences by licenceNumber', async () => {
    const { getMe } = await setup([
      [staffRow],
      [assetRow('IT-0003'), assetRow('IT-0001'), assetRow('IT-0002')],
      [licenceRow('LIC-0002'), licenceRow('LIC-0001')],
    ])

    const result = await getMe({ email: staffRow.email })

    expect(result.assets.map(a => a.assetNumber)).toEqual([
      'IT-0001',
      'IT-0002',
      'IT-0003',
    ])
    expect(result.licences.map(l => l.licenceNumber)).toEqual([
      'LIC-0001',
      'LIC-0002',
    ])
  })
})
