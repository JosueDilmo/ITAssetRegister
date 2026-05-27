import { getGraphAccessToken } from './graphAuth.js'

interface UploadOptions {
  siteId: string
  driveId: string
  folderPath: string
  filename: string
  contentBytes: string
  mimeType: string
}

export async function uploadToSharePoint({
  siteId,
  driveId,
  folderPath,
  filename,
  contentBytes,
  mimeType,
}: UploadOptions): Promise<string> {
  const token = await getGraphAccessToken()
  const path = `${folderPath}/${filename}`

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${path}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType,
      },
      body: Buffer.from(contentBytes, 'base64'),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SharePoint upload failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { webUrl: string }
  return data.webUrl
}
