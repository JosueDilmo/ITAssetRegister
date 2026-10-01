import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: { transaction: vi.fn() },
}))

vi.mock('../../../errors/index.js', () => ({
  DatabaseError: class DatabaseError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'DatabaseError'
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'NotFoundError'
    }
  },
  ERROR_MESSAGES: {
    LICENCE_NOT_FOUND: 'Licence not found.',
    DATABASE_TRANSACTION_ERROR: 'DB error.',
  },
}))

describe('updateLicence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('updates status and note and appends changelog', async () => {
    const { db } = await import('../../../drizzle/client.js')

    // First update (status+note): .set().where() resolves undefined (no .returning())
    const firstUpdateWhere = vi.fn().mockResolvedValue(undefined)
    const firstUpdateSet = vi.fn().mockReturnValue({ where: firstUpdateWhere })
    // Second update (changelog): .set().where() returns object with .returning() resolving to non-empty array
    const secondUpdateReturning = vi.fn().mockResolvedValue([{ id: 'lic-1' }])
    const secondUpdateWhere = vi
      .fn()
      .mockReturnValue({ returning: secondUpdateReturning })
    const secondUpdateSet = vi
      .fn()
      .mockReturnValue({ where: secondUpdateWhere })

    const updateMock = vi
      .fn()
      .mockReturnValueOnce({ set: firstUpdateSet })
      .mockReturnValueOnce({ set: secondUpdateSet })

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 'lic-1', status: 'ACTIVE', note: 'old', changeLog: [] },
                ]),
            }),
          }),
        }),
        update: updateMock,
      })
    )

    const { update } = await import('./update.js')
    const result = await update({
      id: 'lic-1',
      status: 'INACTIVE',
      note: 'retired',
      updatedBy: 'admin@mastertech.ie',
    })

    expect(result.success).toBe(true)
  })

  it('updates serialNumber and appends a serialNumber changelog entry', async () => {
    const { db } = await import('../../../drizzle/client.js')

    const firstUpdateSet = vi
      .fn()
      .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    const secondUpdateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'lic-1' }]),
      }),
    })
    const updateMock = vi
      .fn()
      .mockReturnValueOnce({ set: firstUpdateSet })
      .mockReturnValueOnce({ set: secondUpdateSet })

    const existingEntry = {
      updatedBy: 'a@b.ie',
      updatedAt: '2026-01-01T00:00:00.000Z',
      updatedField: 'status and note',
      previousValue: ['ACTIVE', 'x'],
      newValue: ['INACTIVE', 'y'],
    }

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 'lic-1',
                  status: 'ACTIVE',
                  note: 'old',
                  serialNumber: null,
                  changeLog: [existingEntry],
                },
              ]),
            }),
          }),
        }),
        update: updateMock,
      })
    )

    const { update } = await import('./update.js')
    const result = await update({
      id: 'lic-1',
      status: 'ACTIVE',
      note: 'old',
      serialNumber: 'SN-777',
      updatedBy: 'admin@mastertech.ie',
    })

    expect(result.success).toBe(true)
    expect(firstUpdateSet.mock.calls[0][0].serialNumber).toBe('SN-777')
    const log = secondUpdateSet.mock.calls[0][0].changeLog
    expect(log).toHaveLength(3)
    expect(log[0]).toEqual(existingEntry)
    expect(log[2].updatedField).toBe('serialNumber')
    expect(log[2].previousValue).toEqual([''])
    expect(log[2].newValue).toEqual(['SN-777'])
  })

  it('leaves serialNumber untouched when omitted from the update', async () => {
    const { db } = await import('../../../drizzle/client.js')

    const firstUpdateSet = vi
      .fn()
      .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    const secondUpdateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'lic-1' }]),
      }),
    })
    const updateMock = vi
      .fn()
      .mockReturnValueOnce({ set: firstUpdateSet })
      .mockReturnValueOnce({ set: secondUpdateSet })

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 'lic-1',
                  status: 'ACTIVE',
                  note: 'old',
                  serialNumber: 'SN-1',
                  changeLog: [],
                },
              ]),
            }),
          }),
        }),
        update: updateMock,
      })
    )

    const { update } = await import('./update.js')
    await update({
      id: 'lic-1',
      status: 'INACTIVE',
      note: 'old',
      updatedBy: 'admin@mastertech.ie',
    })

    expect(firstUpdateSet.mock.calls[0][0]).not.toHaveProperty('serialNumber')
    expect(secondUpdateSet.mock.calls[0][0].changeLog).toHaveLength(1)
  })

  it('throws NotFoundError when licence is missing', async () => {
    const { db } = await import('../../../drizzle/client.js')

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      })
    )

    const { update } = await import('./update.js')
    await expect(
      update({
        id: 'missing',
        status: 'INACTIVE',
        note: null,
        updatedBy: 'a@b.ie',
      })
    ).rejects.toThrow('Licence not found.')
  })

  it('throws DatabaseError when changelog update returns empty result', async () => {
    const { db } = await import('../../../drizzle/client.js')

    const firstUpdateWhere = vi.fn().mockResolvedValue(undefined)
    const firstUpdateSet = vi.fn().mockReturnValue({ where: firstUpdateWhere })
    // Second update (changelog): .returning() resolves to [] triggering DatabaseError
    const secondUpdateReturning = vi.fn().mockResolvedValue([])
    const secondUpdateWhere = vi
      .fn()
      .mockReturnValue({ returning: secondUpdateReturning })
    const secondUpdateSet = vi
      .fn()
      .mockReturnValue({ where: secondUpdateWhere })

    const updateMock = vi
      .fn()
      .mockReturnValueOnce({ set: firstUpdateSet })
      .mockReturnValueOnce({ set: secondUpdateSet })

    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: 'lic-1', status: 'ACTIVE', note: 'old', changeLog: [] },
                ]),
            }),
          }),
        }),
        update: updateMock,
      })
    )

    const { update } = await import('./update.js')
    await expect(
      update({
        id: 'lic-1',
        status: 'INACTIVE',
        note: 'retired',
        updatedBy: 'admin@mastertech.ie',
      })
    ).rejects.toThrow('DB error.')
  })
})
