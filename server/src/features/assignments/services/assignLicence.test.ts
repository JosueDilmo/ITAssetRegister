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

// biome-ignore lint/suspicious/noExplicitAny: test mock row
type Row = Record<string, any>

function makeTrx({
  staff,
  licence,
  previousOwner,
}: {
  staff: Row[]
  licence: Row[]
  previousOwner?: Row[]
}) {
  const selectQueue = previousOwner
    ? [staff, licence, previousOwner]
    : [staff, licence]
  const setPayloads: Row[] = []
  return {
    setPayloads,
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(selectQueue.shift() ?? []),
        }),
      }),
    })),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((payload: Row) => {
        setPayloads.push(payload)
        return {
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'lic-1' }]),
          }),
        }
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
const bobEarlierEntries = [
  {
    updatedBy: 'a@b.ie',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedField: 'licenceHistoryList',
    previousValue: [],
    newValue: ['lic-1'],
  },
  {
    updatedBy: 'a@b.ie',
    updatedAt: '2026-02-01T00:00:00.000Z',
    updatedField: 'name',
    previousValue: ['Bobby'],
    newValue: ['Bob'],
  },
]
const bobRow = {
  id: 'staff-2',
  name: 'Bob',
  email: 'bob@mastertech.ie',
  licenceHistoryList: ['lic-1'],
  changeLog: bobEarlierEntries,
}

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
          previousOwner: [bobRow],
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
  describe('previous owner history on reassignment (LIC-04)', () => {
    it('appends a reassignment entry to the previous owner changeLog, keeping earlier entries first', async () => {
      const { db } = await import('../../../drizzle/client.js')
      const trx = makeTrx({
        staff: [staffRow],
        licence: [
          { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
        ],
        previousOwner: [bobRow],
      })
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(trx))

      const { assignLicence } = await import('./assignLicence.js')
      await assignLicence({
        staffEmail: 'jane@mastertech.ie',
        licenceId: 'lic-1',
        updatedBy: 'admin@mastertech.ie',
        userConfirmed: true,
      })

      const prevOwnerWrite = trx.setPayloads.find(
        payload =>
          Array.isArray(payload.changeLog) &&
          payload.changeLog.some(
            (entry: { newValue?: string[] }) =>
              entry.newValue?.[0] ===
              'Licence reassigned: lic-1 to jane@mastertech.ie'
          )
      )
      expect(prevOwnerWrite).toBeDefined()
      const log = prevOwnerWrite?.changeLog ?? []
      expect(log).toHaveLength(bobEarlierEntries.length + 1)
      expect(log.slice(0, bobEarlierEntries.length)).toEqual(bobEarlierEntries)
      expect(log[log.length - 1]).toMatchObject({
        updatedBy: 'admin@mastertech.ie',
        updatedField: 'licenceHistoryList',
        newValue: ['Licence reassigned: lic-1 to jane@mastertech.ie'],
      })
    })

    it('does not change the previous owner licenceHistoryList (cumulative history)', async () => {
      const { db } = await import('../../../drizzle/client.js')
      const trx = makeTrx({
        staff: [staffRow],
        licence: [
          { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
        ],
        previousOwner: [bobRow],
      })
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(trx))

      const { assignLicence } = await import('./assignLicence.js')
      await assignLicence({
        staffEmail: 'jane@mastertech.ie',
        licenceId: 'lic-1',
        updatedBy: 'admin@mastertech.ie',
        userConfirmed: true,
      })

      // Only the new owner's licenceHistoryList is written.
      const historyWrites = trx.setPayloads.filter(
        payload => 'licenceHistoryList' in payload
      )
      expect(historyWrites).toHaveLength(1)
      expect(historyWrites[0].licenceHistoryList).toEqual(['lic-1'])
    })

    it('makes no previous-owner query or write on a first-time assignment', async () => {
      const { db } = await import('../../../drizzle/client.js')
      const trx = makeTrx({ staff: [staffRow], licence: [licenceRow] })
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(trx))

      const { assignLicence } = await import('./assignLicence.js')
      await assignLicence({
        staffEmail: 'jane@mastertech.ie',
        licenceId: 'lic-1',
        updatedBy: 'admin@mastertech.ie',
      })

      expect(trx.select).toHaveBeenCalledTimes(2)
      expect(JSON.stringify(trx.setPayloads)).not.toContain(
        'Licence reassigned'
      )
    })

    it('performs no writes when reassignment is unconfirmed', async () => {
      const { db } = await import('../../../drizzle/client.js')
      const trx = makeTrx({
        staff: [staffRow],
        licence: [
          { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
        ],
        previousOwner: [bobRow],
      })
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(trx))

      const { assignLicence } = await import('./assignLicence.js')
      await expect(
        assignLicence({
          staffEmail: 'jane@mastertech.ie',
          licenceId: 'lic-1',
          updatedBy: 'admin@mastertech.ie',
        })
      ).rejects.toThrow('Licence is already assigned to')
      expect(trx.update).not.toHaveBeenCalled()
    })

    it('throws NotFoundError and aborts when the previous owner staff row is missing', async () => {
      const { db } = await import('../../../drizzle/client.js')
      const trx = makeTrx({
        staff: [staffRow],
        licence: [
          { id: 'lic-1', assignedTo: 'bob@mastertech.ie', changeLog: [] },
        ],
        previousOwner: [],
      })
      // biome-ignore lint/suspicious/noExplicitAny: test mock callback
      vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(trx))

      const { assignLicence } = await import('./assignLicence.js')
      await expect(
        assignLicence({
          staffEmail: 'jane@mastertech.ie',
          licenceId: 'lic-1',
          updatedBy: 'admin@mastertech.ie',
          userConfirmed: true,
        })
      ).rejects.toThrow('Staff not found. Email: bob@mastertech.ie')
      expect(trx.update).not.toHaveBeenCalled()
    })
  })
})
