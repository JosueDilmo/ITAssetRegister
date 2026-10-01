import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({ db: { transaction: vi.fn() } }))

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
  DatabaseError: class DatabaseError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'DatabaseError'
    }
  },
  ERROR_MESSAGES: {
    STAFF_NOT_FOUND: 'Staff not found.',
    LICENCE_NOT_FOUND: 'Licence not found.',
    CONFLICTING_CONFIRM: 'Confirm to proceed.',
    LICENCE_REMOVAL_FAILED: 'Removal failed.',
  },
}))

// biome-ignore lint/suspicious/noExplicitAny: test mock callback
function makeTrx({ licence, staff }: { licence: any[]; staff: any[] }) {
  const selectQueue = [licence, staff]
  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(selectQueue.shift() ?? []),
        }),
      }),
    })),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'lic-1' }]),
        }),
      }),
    }),
  }
}

describe('unassignLicence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('throws ConflictError when not confirmed', async () => {
    const { unassignLicence } = await import('./unassignLicence.js')
    await expect(
      unassignLicence({
        licenceId: 'lic-1',
        updatedBy: 'a@b.ie',
        userConfirmed: false,
      })
    ).rejects.toThrow('Confirm to proceed.')
  })

  it('removes assignment when confirmed', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb(
        makeTrx({
          licence: [
            {
              id: 'lic-1',
              assignedTo: 'jane@mastertech.ie',
              dateAssigned: '2026-01-01',
              changeLog: [],
            },
          ],
          staff: [
            {
              id: 'staff-1',
              email: 'jane@mastertech.ie',
              licenceHistoryList: ['lic-1'],
              changeLog: [],
            },
          ],
        })
      )
    )

    const { unassignLicence } = await import('./unassignLicence.js')
    const result = await unassignLicence({
      licenceId: 'lic-1',
      updatedBy: 'admin@mastertech.ie',
      userConfirmed: true,
    })
    expect(result.success).toBe(true)
  })
})
