interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

interface GoogleAccountsOauth2 {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
  }) => GoogleTokenClient
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleAccountsOauth2
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

let tokenClient: GoogleTokenClient | null = null

export function isGoogleReady(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2
}

export function requestAccessToken(
  onSuccess: (token: string) => void,
  onError: (message: string) => void
) {
  if (!CLIENT_ID) {
    onError('لم يتم إعداد معرّف عميل جوجل')
    return
  }
  if (!isGoogleReady()) {
    onError('لم تُحمَّل خدمة جوجل بعد، حاول مجدداً')
    return
  }

  const handler = (response: GoogleTokenResponse) => {
    if (response.error || !response.access_token) {
      onError(response.error ?? 'تعذّر الحصول على إذن الوصول')
      return
    }
    onSuccess(response.access_token)
  }

  if (!tokenClient) {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handler,
    })
  } else {
    tokenClient.callback = handler
  }

  tokenClient.requestAccessToken()
}

export async function uploadFileToDrive(
  accessToken: string,
  file: File
): Promise<string> {
  const metadata = { name: file.name, mimeType: file.type || 'application/octet-stream' }
  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append('file', file)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  )

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }

  const data: { id: string } = await res.json()
  return data.id
}

export async function makeFilePublic(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  )

  if (!res.ok) {
    throw new Error(`Permission failed (${res.status})`)
  }
}

export function getShareLink(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
}
