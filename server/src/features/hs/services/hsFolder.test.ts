import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config/sharePointTargets.js', () => ({
  getSharePointTargets: vi.fn(),
}))

vi.mock('../../../shared/services/graphDriveClient.js', () => ({
  getItemByRelativePath: vi.fn(),
  ensureFolder: vi.fn(),
  putFile: vi.fn(),
  putFileByPath: vi.fn(),
  deleteItem: vi.fn(),
}))

import {
  deleteItem,
  ensureFolder,
  getItemByRelativePath,
  putFile,
  putFileByPath,
} from '../../../shared/services/graphDriveClient.js'
import type { SharePointTargets } from '../config/sharePointTargets.js'
import { findHsFolder } from './hsFolder.js'

const targets: SharePointTargets = {
  me: {
    siteId: 's',
    driveId: 'me-drive',
    projectsRoot: '01_Proj/Open',
    projectHsPath: '1. Cons/5. H&S',
    permitsFolder: 'Permits',
  },
  qhse: {
    siteId: 'q',
    preapproved: { driveId: 'p', root: '' },
    control: { driveId: 'c', root: '' },
  },
}

describe('findHsFolder (D-20d)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves 1. Cons/5. H&S by relative path and returns the folder item', async () => {
    const folder = { id: 'hs1', name: '5. H&S', webUrl: 'u', folder: {} }
    vi.mocked(getItemByRelativePath).mockResolvedValueOnce(folder)

    await expect(findHsFolder('p1', targets)).resolves.toEqual(folder)
    expect(getItemByRelativePath).toHaveBeenCalledWith(
      'me-drive',
      'p1',
      '1. Cons/5. H&S'
    )
  })

  it('returns null on 404 (getItemByRelativePath yields null)', async () => {
    vi.mocked(getItemByRelativePath).mockResolvedValueOnce(null)

    await expect(findHsFolder('p1', targets)).resolves.toBeNull()
  })

  it('returns null when the item is a file, not a folder', async () => {
    vi.mocked(getItemByRelativePath).mockResolvedValueOnce({
      id: 'f1',
      name: '5. H&S',
      webUrl: 'u',
      file: {},
    })

    await expect(findHsFolder('p1', targets)).resolves.toBeNull()
  })

  it('never creates or writes anything', async () => {
    vi.mocked(getItemByRelativePath).mockResolvedValue(null)

    await findHsFolder('p1', targets)

    expect(ensureFolder).not.toHaveBeenCalled()
    expect(putFile).not.toHaveBeenCalled()
    expect(putFileByPath).not.toHaveBeenCalled()
    expect(deleteItem).not.toHaveBeenCalled()
  })
})
