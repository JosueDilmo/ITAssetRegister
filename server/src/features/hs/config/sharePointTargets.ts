import { HsNotConfiguredError } from '../../../errors/index.js'
import { hsConfigured, hsEnv } from '../../../hsEnv.js'

export interface SharePointTargets {
  me: {
    siteId: string
    driveId: string
    projectsRoot: string
    projectHsPath: string
    permitsFolder: string
  }
  qhse: {
    siteId: string
    preapproved: { driveId: string; root: string }
    control: { driveId: string; root: string }
  }
}

// Every SharePoint location comes from env only (D-20, D-21).
export function getSharePointTargets(): SharePointTargets {
  if (
    !hsConfigured ||
    !hsEnv.HS_ME_SITE_ID ||
    !hsEnv.HS_ME_DRIVE_ID ||
    !hsEnv.HS_QHSE_SITE_ID ||
    !hsEnv.HS_QHSE_PREAPPROVED_DRIVE_ID ||
    !hsEnv.HS_QHSE_CONTROL_DRIVE_ID
  ) {
    throw new HsNotConfiguredError()
  }
  return {
    me: {
      siteId: hsEnv.HS_ME_SITE_ID,
      driveId: hsEnv.HS_ME_DRIVE_ID,
      projectsRoot: hsEnv.HS_ME_PROJECTS_ROOT,
      projectHsPath: hsEnv.HS_ME_PROJECT_HS_PATH,
      permitsFolder: hsEnv.HS_ME_PERMITS_FOLDER,
    },
    qhse: {
      siteId: hsEnv.HS_QHSE_SITE_ID,
      preapproved: {
        driveId: hsEnv.HS_QHSE_PREAPPROVED_DRIVE_ID,
        root: hsEnv.HS_QHSE_PREAPPROVED_ROOT,
      },
      control: {
        driveId: hsEnv.HS_QHSE_CONTROL_DRIVE_ID,
        root: hsEnv.HS_QHSE_CONTROL_ROOT,
      },
    },
  }
}
