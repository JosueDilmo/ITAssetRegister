import { GRAPH_BASE, type GraphFetchOptions, graphFetch } from './graphFetch.js'

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
