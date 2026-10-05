import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: { select: vi.fn(), transaction: vi.fn() },
}))

vi.mock('../../../errors/index.js', () => ({
  ConflictError: class ConflictError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'ConflictError'
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'NotFoundError'
    }
  },
  ERROR_MESSAGES: {
    LICENCE_ALREADY_EXISTS: 'Licence already registered.',
    STAFF_NOT_FOUND: 'Staff not found.',
  },
}))

const baseParams = {
  name: 'ADOBE ACROBAT PRO',
  vendor: 'ADOBE',
  licenceType: 'SUBSCRIPTION',
  licenceKey: null,
  licenceNumber: 'LIC-0001',
  datePurchased: '2026-01-01',
  expiryDate: '2027-01-01',
  cost: '120.00',
  assignedTo: null,
  createdBy: 'admin@mastertech.ie',
}

describe('createLicence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('registers an unassigned licence', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi
          .fn()
          .mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    } as any)

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: 'lic-1', assignedTo: null, changeLog: [] },
              ]),
          }),
        }),
      })
    )

    const { create } = await import('./create.js')
    const result = await create(baseParams)

    expect(result.success).toBe(true)
    expect(result.licenceId).toBe('lic-1')
    expect(result.staff).toBeNull()
  })

  it('persists an optional serialNumber and defaults it to null', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const insertedValues: Array<Record<string, unknown>> = []

    for (let i = 0; i < 2; i++) {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        }),
        // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      } as any)
    }

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((v: Record<string, unknown>) => {
            insertedValues.push(v)
            return {
              returning: vi
                .fn()
                .mockResolvedValue([
                  { id: 'lic-1', assignedTo: null, changeLog: [] },
                ]),
            }
          }),
        }),
      })
    )

    const { create } = await import('./create.js')
    await create({ ...baseParams, serialNumber: 'SN-12345' })
    await create(baseParams)

    expect(insertedValues[0].serialNumber).toBe('SN-12345')
    expect(insertedValues[1].serialNumber).toBeNull()
  })

  it('throws ConflictError when licenceNumber already exists', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'dup' }]),
        }),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    } as any)

    const { create } = await import('./create.js')
    await expect(create(baseParams)).rejects.toThrow(
      'Licence already registered.'
    )
  })
})
