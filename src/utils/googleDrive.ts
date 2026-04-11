interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number
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
const TOKEN_STORAGE_KEY = 'gdrive_token_v1'
const CONSENTED_STORAGE_KEY = 'gdrive_consented_v1'

let tokenClient: GoogleTokenClient | null = null

interface StoredToken {
  accessToken: string
  expiresAt: number
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredToken
    if (Date.now() >= stored.expiresAt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return null
    }
    return stored.accessToken
  } catch {
    return null
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

function storeToken(accessToken: string, expiresInSec: number): void {
  const data: StoredToken = {
    accessToken,
    expiresAt: Date.now() + Math.max(0, (expiresInSec - 60) * 1000),
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data))
}

export function hasConsented(): boolean {
  return localStorage.getItem(CONSENTED_STORAGE_KEY) === '1'
}

function setConsented(): void {
  localStorage.setItem(CONSENTED_STORAGE_KEY, '1')
}

export function isGoogleReady(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2
}

function waitForGoogleReady(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleReady()) return resolve()
    const start = Date.now()
    const check = () => {
      if (isGoogleReady()) return resolve()
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('لم تُحمَّل خدمة جوجل في الوقت المحدد'))
      }
      setTimeout(check, 50)
    }
    check()
  })
}

export function requestAccessToken(silent = false): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('لم يتم إعداد معرّف عميل جوجل'))
      return
    }
    if (!isGoogleReady()) {
      reject(new Error('لم تُحمَّل خدمة جوجل بعد، حاول مجدداً'))
      return
    }

    const handler = (response: GoogleTokenResponse) => {
      if (response.error || !response.access_token) {
        reject(new Error(response.error ?? 'تعذّر الحصول على إذن الوصول'))
        return
      }
      storeToken(response.access_token, response.expires_in ?? 3600)
      setConsented()
      resolve(response.access_token)
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

    tokenClient.requestAccessToken(silent ? { prompt: '' } : {})
  })
}

export async function ensureAccessToken(): Promise<string | null> {
  const stored = getStoredToken()
  if (stored) return stored
  if (!hasConsented()) return null
  try {
    await waitForGoogleReady()
    return await requestAccessToken(true)
  } catch {
    return null
  }
}

const CHUNK_SIZE = 8 * 1024 * 1024

export interface UploadOptions {
  onProgress?: (loaded: number, total: number) => void
  fileName?: string
}

function isQuotaError(body: string): boolean {
  return body.includes('storageQuotaExceeded') || body.includes('quotaExceeded')
}

interface PutChunkResult {
  status: number
  fileId?: string
}

function putChunk(opts: {
  uploadUrl: string
  chunk: Blob
  start: number
  end: number
  total: number
  mimeType: string
  onChunkProgress: (loaded: number) => void
}): Promise<PutChunkResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', opts.uploadUrl, true)
    xhr.setRequestHeader('Content-Type', opts.mimeType)
    xhr.setRequestHeader(
      'Content-Range',
      `bytes ${opts.start}-${opts.end}/${opts.total}`
    )

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) opts.onChunkProgress(e.loaded)
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ status: xhr.status, fileId: data.id })
        } catch {
          reject(new Error('تعذّر قراءة رد الخادم'))
        }
      } else if (xhr.status === 308) {
        resolve({ status: 308 })
      } else if (xhr.status === 403 && isQuotaError(xhr.responseText)) {
        reject(new Error('مساحة التخزين في جوجل درايف ممتلئة'))
      } else {
        reject(new Error(`Upload chunk failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع'))
    xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع'))
    xhr.send(opts.chunk)
  })
}

export async function uploadFileToDrive(
  accessToken: string,
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const mimeType = file.type || 'application/octet-stream'
  const metadata = { name: options.fileName || file.name, mimeType }

  const initRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(file.size),
      },
      body: JSON.stringify(metadata),
    }
  )

  if (!initRes.ok) {
    if (initRes.status === 403) {
      const body = await initRes.text().catch(() => '')
      if (isQuotaError(body)) {
        throw new Error('مساحة التخزين في جوجل درايف ممتلئة')
      }
    }
    throw new Error(`Upload init failed (${initRes.status})`)
  }

  const uploadUrl = initRes.headers.get('Location')
  if (!uploadUrl) {
    throw new Error('لم يُعَد عنوان رفع من جوجل')
  }

  const totalSize = file.size
  options.onProgress?.(0, totalSize)

  if (totalSize === 0) {
    const emptyRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: file,
    })
    if (!emptyRes.ok) {
      throw new Error(`Upload failed (${emptyRes.status})`)
    }
    const data: { id: string } = await emptyRes.json()
    return data.id
  }

  let uploadedBytes = 0
  let fileId: string | null = null

  while (uploadedBytes < totalSize) {
    const end = Math.min(uploadedBytes + CHUNK_SIZE, totalSize)
    const chunk = file.slice(uploadedBytes, end)
    const isLastChunk = end === totalSize
    const chunkBaseBytes = uploadedBytes

    const result = await putChunk({
      uploadUrl,
      chunk,
      start: uploadedBytes,
      end: end - 1,
      total: totalSize,
      mimeType,
      onChunkProgress: chunkLoaded => {
        options.onProgress?.(
          Math.min(chunkBaseBytes + chunkLoaded, totalSize),
          totalSize
        )
      },
    })

    uploadedBytes = end
    options.onProgress?.(uploadedBytes, totalSize)

    if (isLastChunk) {
      if (!result.fileId) {
        throw new Error('اكتمل الرفع لكن لم يُعَد معرّف الملف')
      }
      fileId = result.fileId
    }
  }

  if (!fileId) {
    throw new Error('لم يكتمل الرفع')
  }
  return fileId
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
