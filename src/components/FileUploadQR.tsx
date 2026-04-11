import { useState } from 'react'
import {
  requestAccessToken,
  uploadFileToDrive,
  makeFilePublic,
  getShareLink,
} from '../utils/googleDrive'
import styles from '../styles/FileUploadQR.module.css'

const MAX_SIZE = 5 * 1024 * 1024

interface Props {
  onUploaded: (link: string) => void
  currentLink: string
}

export default function FileUploadQR({ onUploaded, currentLink }: Props) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = () => {
    setError(null)
    requestAccessToken(
      token => setAccessToken(token),
      message => setError(message)
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !accessToken) return

    if (file.size > MAX_SIZE) {
      setError('حجم الملف يجب أن يكون أقل من 5 ميجابايت')
      return
    }

    setUploading(true)
    setError(null)
    setFileName(file.name)

    try {
      const fileId = await uploadFileToDrive(accessToken, file)
      await makeFilePublic(accessToken, fileId)
      onUploaded(getShareLink(fileId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل رفع الملف'
      if (message.includes('401')) {
        setAccessToken(null)
        setError('انتهت صلاحية الجلسة، سجّل الدخول مجدداً')
      } else {
        setError(message)
      }
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }

  if (!accessToken) {
    return (
      <div className={styles.fileSection}>
        <button onClick={handleSignIn} className={styles.signInButton}>
          تسجيل الدخول بحساب جوجل
        </button>
        <p className={styles.hint}>
          سيُرفع الملف إلى جوجل درايف الخاص بك ويصبح عاماً عبر الرابط
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }

  return (
    <div className={styles.fileSection}>
      <label className={styles.fileLabel}>
        {uploading
          ? 'جاري الرفع...'
          : fileName
            ? `الملف: ${fileName}`
            : 'اختر ملفاً للرفع'}
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          hidden
        />
      </label>
      {currentLink && !uploading && (
        <p className={styles.fileLink}>
          <a href={currentLink} target="_blank" rel="noopener noreferrer">
            فتح الرابط في درايف
          </a>
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
