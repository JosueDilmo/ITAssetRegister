// This file exposes the app version from package.json for use in the app
import packageJson from '../../../package.json'

export const APP_VERSION = packageJson.version as string
