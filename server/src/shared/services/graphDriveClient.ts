import {
  GRAPH_BASE,
  GraphError,
  type GraphFetchOptions,
  graphFetch,
} from './graphFetch.js'

export interface DriveItemRef {
  id: string
  name: string
  webUrl: string
  eTag?: string
  folder?: { childCount?: number }
  file?: { mimeType?: string }
}

/**
 * Encodes a SharePoint path per segment (D-20b). Real folder names contain spaces,
 * dots, '&', apostrophes and double spaces. Rejects an empty path or empty segment.
 */
export function encodePath(path: string): string {
  const segments = path.split('/')
  if (path === '' || segments.some(segment => segment === '')) {
    throw new Error('encodePath: empty path segment')
  }
  return segments.map(encodeURIComponent).join('/')
}

/**
 * Lists the direct children of a folder, following @odata.nextLink until absent.
 * Never lists a drive root and never recurses (D-20a: the M&E library holds ~178,800 items).
 * graphFetch's origin check guards every followed nextLink.
 */
export async function listChildren(
  driveId: string,
  at: { path: string } | { itemId: string },
  opts: GraphFetchOptions & { top?: number; maxPages?: number } = {}
): Promise<DriveItemRef[]> {
  const base =
    'path' in at
      ? `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodePath(at.path)}:/children`
      : `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(at.itemId)}/children`

  const maxPages = opts.maxPages ?? 100
  const items: DriveItemRef[] = []
  let url: string | undefined =
    `${base}?$select=id,name,webUrl,folder,file&$top=${opts.top ?? 200}`
  let pages = 0

  while (url) {
    if (pages >= maxPages) throw new Error('listChildren: page guard exceeded')
    pages++
    const res = await graphFetch(url, {}, opts)
    const body = (await res.json()) as {
      value?: DriveItemRef[]
      '@odata.nextLink'?: string
    }
    if (Array.isArray(body.value)) items.push(...body.value)
    url = body['@odata.nextLink']
  }

  return items
}

const ITEM_SELECT = '$select=id,name,webUrl,eTag,folder,file'

export type ConflictBehavior = 'fail' | 'replace' | 'rename'

const INVALID_NAME_CHARS = /["*:<>?/\\|#%]/

/**
 * SharePoint item-name rules: rejects empty names, reserved characters, a leading
 * '~' or whitespace, and a trailing '.' or whitespace. Also blocks path injection
 * through names.
 */
export function assertValidItemName(name: string): void {
  if (
    name === '' ||
    INVALID_NAME_CHARS.test(name) ||
    name.startsWith('~') ||
    /^\s/.test(name) ||
    name.endsWith('.') ||
    /\s$/.test(name)
  ) {
    throw new Error('Invalid SharePoint item name')
  }
}

async function getOrNull(
  url: string,
  opts: GraphFetchOptions
): Promise<DriveItemRef | null> {
  try {
    const res = await graphFetch(url, {}, opts)
    return (await res.json()) as DriveItemRef
  } catch (err) {
    if (err instanceof GraphError && err.status === 404) return null
    throw err
  }
}

export function getItem(
  driveId: string,
  itemId: string,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef | null> {
  return getOrNull(
    `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}?${ITEM_SELECT}`,
    opts
  )
}

export function getItemByPath(
  driveId: string,
  path: string,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef | null> {
  return getOrNull(
    `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodePath(path)}?${ITEM_SELECT}`,
    opts
  )
}

export function getItemByRelativePath(
  driveId: string,
  baseItemId: string,
  relativePath: string,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef | null> {
  return getOrNull(
    `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(baseItemId)}:/${encodePath(relativePath)}?${ITEM_SELECT}`,
    opts
  )
}

/**
 * Creates a folder under a parent item, idempotently: on 409 (name exists) the
 * existing folder is returned. Addressed by parent item id (D-20b).
 */
export async function ensureFolder(
  driveId: string,
  parentItemId: string,
  name: string,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef> {
  assertValidItemName(name)
  try {
    const res = await graphFetch(
      `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(parentItemId)}/children`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        }),
      },
      opts
    )
    return (await res.json()) as DriveItemRef
  } catch (err) {
    if (!(err instanceof GraphError) || err.status !== 409) throw err
    const existing = await getItemByRelativePath(
      driveId,
      parentItemId,
      name,
      opts
    )
    if (!existing?.folder) {
      throw new Error('ensureFolder: name exists but is not a folder')
    }
    return existing
  }
}

export interface PutFileInput {
  driveId: string
  parentItemId: string
  fileName: string
  content: Buffer
  contentType: string
  conflictBehavior: ConflictBehavior
}

/**
 * Uploads a file under a parent item id. conflictBehavior is required: nothing is
 * overwritten unless the caller asks (retention is permanent).
 */
export async function putFile(
  input: PutFileInput,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef> {
  const {
    driveId,
    parentItemId,
    fileName,
    content,
    contentType,
    conflictBehavior,
  } = input
  assertValidItemName(fileName)
  const res = await graphFetch(
    `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(parentItemId)}:/${encodeURIComponent(fileName)}:/content?@microsoft.graph.conflictBehavior=${conflictBehavior}`,
    { method: 'PUT', headers: { 'Content-Type': contentType }, body: content },
    opts
  )
  return (await res.json()) as DriveItemRef
}

export interface PutFileByPathInput {
  driveId: string
  path: string
  content: Buffer
  contentType: string
  conflictBehavior: ConflictBehavior
}

/** Path-addressed upload; used only by the smoke parent-auto-create probe. */
export async function putFileByPath(
  input: PutFileByPathInput,
  opts: GraphFetchOptions = {}
): Promise<DriveItemRef> {
  const { driveId, path, content, contentType, conflictBehavior } = input
  const res = await graphFetch(
    `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodePath(path)}:/content?@microsoft.graph.conflictBehavior=${conflictBehavior}`,
    { method: 'PUT', headers: { 'Content-Type': contentType }, body: content },
    opts
  )
  return (await res.json()) as DriveItemRef
}

/** DELETE moves the item to the recycle bin. True when deleted, false when already gone. */
export async function deleteItem(
  driveId: string,
  itemId: string,
  opts: GraphFetchOptions = {}
): Promise<boolean> {
  try {
    await graphFetch(
      `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
      opts
    )
    return true
  } catch (err) {
    if (err instanceof GraphError && err.status === 404) return false
    throw err
  }
}
