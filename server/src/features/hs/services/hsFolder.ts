import {
  type DriveItemRef,
  getItemByRelativePath,
} from '../../../shared/services/graphDriveClient.js'
import {
  type SharePointTargets,
  getSharePointTargets,
} from '../config/sharePointTargets.js'

// D-20d: the Hub never creates `1. Cons/5. H&S` under an M&E project: it only
// detects it. Phase 6 skips the M&E copy and warns when this returns null.
// Projects are addressed by drive item id because they move Open -> Comp -> Reten
// (D-20b), so the lookup is relative to the project item, never an absolute path.
export async function findHsFolder(
  projectItemId: string,
  targets: SharePointTargets = getSharePointTargets()
): Promise<DriveItemRef | null> {
  const item = await getItemByRelativePath(
    targets.me.driveId,
    projectItemId,
    targets.me.projectHsPath
  )
  return item?.folder ? item : null
}
