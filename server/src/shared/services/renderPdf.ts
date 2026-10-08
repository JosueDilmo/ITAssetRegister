import { convertToPdf, deleteItem, putFile } from './graphDriveClient.js'
import type { GraphFetchOptions } from './graphFetch.js'

/**
 * D-12 PDF rendering seam: the ONLY PDF entry point for H&S code.
 *
 * Fallback order, all behind this function so callers never change:
 *   1. Graph under Selected scopes (current route, route 'graph')
 *   2. Graph under Files.SelectedOperations.Selected
 *   3. Graph under Files.ReadWrite.All
 *      (routes 1-3 are the same code, only the granted permission differs)
 *   4. LibreOffice headless on the IIS host, only if every Graph route fails; this
 *      would replace this module's internals and add a `route` value without
 *      changing callers.
 */

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export interface RenderPdfInput {
  docx: Buffer
  fileName: string
  staging: { driveId: string; parentItemId: string }
}

export interface RenderPdfResult {
  pdf: Buffer
  route: 'graph'
  stagedItemId: string
  elapsedMs: number
}

export async function renderPdf(
  input: RenderPdfInput,
  opts?: GraphFetchOptions & { timeoutMs?: number }
): Promise<RenderPdfResult> {
  const started = performance.now()
  const staged = await putFile(
    {
      driveId: input.staging.driveId,
      parentItemId: input.staging.parentItemId,
      fileName: input.fileName,
      content: input.docx,
      contentType: DOCX_MIME,
      conflictBehavior: 'rename',
    },
    opts
  )
  try {
    const { pdf } = await convertToPdf(input.staging.driveId, staged.id, opts)
    return {
      pdf,
      route: 'graph',
      stagedItemId: staged.id,
      elapsedMs: performance.now() - started,
    }
  } catch (err) {
    // The thrown error does not carry staged.id, so the caller cannot clean up.
    // Best-effort delete here so a failed render never strands a docx in the
    // (permanent) staging library; the original error is what the caller sees.
    try {
      await deleteItem(input.staging.driveId, staged.id, opts)
    } catch {
      // Cleanup failed too: surface the conversion error, not this one.
    }
    throw err
  }
}
