// One-way rule (D-19, D-25): the project code names the QHSE per-project
// subfolder `Pre-approved docs/<code>/`. Once Phase 4 files the first permit
// under that folder, changing this derivation orphans existing folders.
//
// Upper-casing the fallback is the planner's reading of D-25 ("project code is
// normalised to uppercase"); flagged for confirmation before Phase 4's first
// filing. No current folder triggers the fallback (all match PR\d+, D-20b).

export interface ProjectCodeResult {
  code: string
  // false = no PR<digits> prefix; the caller logs it (D-19)
  fromPrefix: boolean
}

// Characters SharePoint rejects in folder names: " * : < > ? / \ | # %
const SHAREPOINT_INVALID_CHARS = /["*:<>?/\\|#%]/g

export function deriveProjectCode(folderName: string): ProjectCodeResult {
  const name = folderName.normalize('NFC').trim()

  const prefix = name.match(/^PR\d+/i)
  if (prefix) {
    return { code: prefix[0].toUpperCase(), fromPrefix: true }
  }

  const code = name
    .replace(/\s+/g, ' ')
    .replace(SHAREPOINT_INVALID_CHARS, '-')
    .replace(/^[~ ]+/, '')
    .replace(/[. ]+$/, '')
    .toUpperCase()

  if (code === '') {
    throw new Error('deriveProjectCode: folder name has no usable characters')
  }
  return { code, fromPrefix: false }
}
