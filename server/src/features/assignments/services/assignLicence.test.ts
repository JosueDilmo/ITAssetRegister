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
    CONFLICTING_LICENCE_ASSIGNMENT: 'Licence is already assigned to',
    CONFLICTING_CONFIRM: 'Confirm to proceed.',
    INTERNAL_DB_ERROR: 'DB error.',
  },
}))

// biome-ignore lint/suspicious/noExplicitAny: test mock callback
function makeTrx({ staff, licence }: { staff: any[]; licence: any[] }) {
  const selectQueue = [staff, licence]
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

const staffRow = {
  id: 'staff-1',
  name: 'Jane',
  email: 'jane@mastertech.ie',
  licenceHistoryList: [],
  changeLog: [],
}
const licenceRow = { id: 'lic-1', assignedTo: null, changeLog: [] }

describe('assignLicence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('assigns an unassigned licence to staff', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb(makeTrx({ staff: [staffRow], licence: [licenceRow] }))
    )

    const { assignLicence } = await import('./assignLicence.js')
    const result = await assignLicence({
      staffEmail: 'jane@mastertech.ie',
      licenceId: 'lic-1',
      updatedBy: 'admin@mastertech.ie',
    })
    expect(result.success).toBe(true)
  })

  it('throws ConflictError on reassignment without confirmation', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb(
        makeTrx({
          staff: [staffRow],
          licence: [
            { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
          ],
        })
      )
    )

    const { assignLicence } = await import('./assignLicence.js')
    await expect(
      assignLicence({
        staffEmail: 'jane@mastertech.ie',
        licenceId: 'lic-1',
        updatedBy: 'a@b.ie',
      })
    ).rejects.toThrow('Licence is already assigned to')
  })

  it('allows reassignment when userConfirmed is true', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb(
        makeTrx({
          staff: [staffRow],
          licence: [
            { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
          ],
        })
      )
    )

    const { assignLicence } = await import('./assignLicence.js')
    const result = await assignLicence({
      staffEmail: 'jane@mastertech.ie',
      licenceId: 'lic-1',
      updatedBy: 'a@b.ie',
      userConfirmed: true,
    })
    expect(result.success).toBe(true)
  })

  it('throws ConflictError when licence already assigned to same staff', async () => {
    const { db } = await import('../../../drizzle/client.js')
    // biome-ignore lint/suspicious/noExplicitAny: test mock callback
    vi.mocked(db.transaction).mockImplementation(async (cb: any) =>
      cb(
        makeTrx({
          staff: [staffRow],
          licence: [
            { id: 'lic-1', assignedTo: 'jane@mastertech.ie', changeLog: [] },
          ],
        })
      )
    )

    const { assignLicence } = await import('./assignLicence.js')
    await expect(
      assignLicence({
        staffEmail: 'jane@mastertech.ie',
        licenceId: 'lic-1',
        updatedBy: 'a@b.ie',
      })
    ).rejects.toThrow('Licence is already assigned to')
  })
})
