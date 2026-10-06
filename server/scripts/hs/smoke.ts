import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { ZodError } from 'zod'

// D-07: rerunnable Graph smoke test (no HTTP endpoint). Run with
//   npm --prefix server run hs:smoke -- [--file <docx>] [--audit-hs-folders]
//     [--tickets-probe] [--expect-selected-only] [--check-config]
// Exit codes: 0 no critical failure, 1 critical failure, 2 configuration or
// missing-file error, 130 interrupted.

const DEFAULT_DOCX = '../docs/design/hs-templates/PM005-W@H Permit v02.docx'

function printZodPaths(err: ZodError): void {
  // Variable names only: never values (T-03-24).
  const paths = [...new Set(err.issues.map(i => i.path.join('.') || '(root)'))]
  console.error('Environment configuration is invalid. Check these variables:')
  for (const path of paths) console.error(`  ${path}`)
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
      'audit-hs-folders': { type: 'boolean', default: false },
      'tickets-probe': { type: 'boolean', default: false },
      'expect-selected-only': { type: 'boolean', default: false },
      'check-config': { type: 'boolean', default: false },
    },
    strict: true,
  })

  const docxPath = resolve(process.cwd(), values.file ?? DEFAULT_DOCX)
  let docxBytes: Buffer
  try {
    docxBytes = await readFile(docxPath)
  } catch {
    console.error(`Cannot read the docx at ${docxPath}`)
    console.error('Pass another file with --file <path-to-docx>.')
    return 2
  }

  let runSmoke: typeof import(
    '../../src/features/hs/services/graphSmoke.js'
  )['runSmoke']
  let renderSmokeMarkdown: typeof import(
    '../../src/features/hs/services/graphSmoke.js'
  )['renderSmokeMarkdown']
  let targets: import(
    '../../src/features/hs/config/sharePointTargets.js'
  ).SharePointTargets
  try {
    // Dynamic imports: the env modules throw on a partial HS group, so they
    // are loaded inside this try to report variable names only.
    const { getSharePointTargets } = await import(
      '../../src/features/hs/config/sharePointTargets.js'
    )
    const { HsNotConfiguredError } = await import('../../src/errors/index.js')
    try {
      targets = getSharePointTargets()
    } catch (err) {
      if (err instanceof HsNotConfiguredError) {
        console.error('H&S SharePoint env not configured (see runbook Part C)')
        return 2
      }
      throw err
    }
    ;({ runSmoke, renderSmokeMarkdown } = await import(
      '../../src/features/hs/services/graphSmoke.js'
    ))
  } catch (err) {
    if (err instanceof ZodError) {
      printZodPaths(err)
      return 2
    }
    throw err
  }

  const controller = new AbortController()
  process.once('SIGINT', () => {
    console.error('Interrupted: stopping probes and cleaning up...')
    controller.abort()
  })

  const report = await runSmoke({
    targets,
    docx: { bytes: docxBytes, fileName: basename(docxPath) },
    signal: controller.signal,
    log: line => console.error(line),
  })

  console.log(renderSmokeMarkdown(report))

  if (controller.signal.aborted) return 130
  return report.criticalFailure ? 1 : 0
}

main()
  .then(code => process.exit(code))
  .catch(err => {
    console.error(
      `Smoke run crashed: ${err instanceof Error ? err.message : 'unknown error'}`
    )
    process.exit(1)
  })
