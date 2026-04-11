import { useState, useEffect } from "react";
import {
  requestAccessToken,
  ensureAccessToken,
  uploadFileToDrive,
  makeFilePublic,
  getShareLink,
  getStoredToken,
  clearStoredToken,
  hasConsented,
} from "../utils/googleDrive";

interface Props {
  onUploaded: (link: string) => void;
  currentLink: string;
  title: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function buildDriveFileName(originalName: string, title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return originalName;
  const lastDot = originalName.lastIndexOf(".");
  const ext = lastDot > 0 ? originalName.slice(lastDot) : "";
  return trimmed.endsWith(ext) ? trimmed : trimmed + ext;
}

export default function FileUploadQR({
  onUploaded,
  currentLink,
  title,
}: Props) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredToken(),
  );
  const [initializing, setInitializing] = useState(
    () => !getStoredToken() && hasConsented(),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing) return;
    let cancelled = false;
    ensureAccessToken().then((token) => {
      if (cancelled) return;
      if (token) setAccessToken(token);
      setInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initializing]);

  const handleSignIn = async () => {
    setError(null);
    try {
      const token = await requestAccessToken(false);
      setAccessToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSelectedFile(file);
    setProgress(0);
    setError(null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile || uploading) return;

    let token = await ensureAccessToken();
    if (!token) {
      setAccessToken(null);
      setError("انتهت صلاحية الجلسة، سجّل الدخول مجدداً");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const driveFileName = buildDriveFileName(selectedFile.name, title);
    const fileToUpload = selectedFile;

    const doUpload = async (t: string): Promise<string> => {
      const fileId = await uploadFileToDrive(t, fileToUpload, {
        onProgress: (loaded) => setProgress(loaded),
        fileName: driveFileName,
      });
      await makeFilePublic(t, fileId);
      return fileId;
    };

    try {
      let fileId: string;
      try {
        fileId = await doUpload(token);
      } catch (err) {
        if (err instanceof Error && err.message.includes("401")) {
          clearStoredToken();
          const fresh = await requestAccessToken(true).catch(() => null);
          if (!fresh) {
            setAccessToken(null);
            setError("انتهت صلاحية الجلسة، سجّل الدخول مجدداً");
            return;
          }
          token = fresh;
          setAccessToken(fresh);
          setProgress(0);
          fileId = await doUpload(fresh);
        } else {
          throw err;
        }
      }
      onUploaded(getShareLink(fileId));
      setSelectedFile(null);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center w-full py-4">
        <span className="loading loading-dots loading-md"></span>
        <span className="mr-2 text-sm text-base-content/60">
          جاري التحقق من الجلسة...
        </span>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={handleSignIn}
          className="btn btn-outline w-full"
        >
          تسجيل الدخول بحساب جوجل
        </button>
        <p className="text-xs text-base-content/60 text-center leading-relaxed">
          سيُرفع الملف إلى جوجل درايف الخاص بك ويصبح عاماً عبر الرابط
        </p>
        {error && (
          <div className="alert alert-error text-sm py-2">
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const percent =
    selectedFile && selectedFile.size
      ? Math.round((progress / selectedFile.size) * 100)
      : 0;
  const driveName = selectedFile
    ? buildDriveFileName(selectedFile.name, title)
    : "";

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="btn btn-outline w-full font-normal normal-case">
        {selectedFile ? `الملف: ${selectedFile.name}` : "اختر ملفاً للرفع"}
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          hidden
        />
      </label>

      {uploading && selectedFile && (
        <div className="flex flex-col gap-2">
          <progress
            className="progress progress-primary w-full"
            value={progress}
            max={selectedFile.size}
          ></progress>
          <p className="text-xs text-base-content/60 text-center">
            {formatBytes(progress)} / {formatBytes(selectedFile.size)} (
            {percent}%)
          </p>
        </div>
      )}

      {selectedFile && !uploading && (
        <>
          <p className="text-xs text-base-content/60 text-center break-all">
            سيُرفع باسم: <strong className="text-base-content">{driveName}</strong>
          </p>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleUploadClick}
          >
            رفع إلى درايف
          </button>
        </>
      )}

      {currentLink && !uploading && !selectedFile && (
        <p className="text-sm text-center">
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary font-semibold"
          >
            فتح الرابط في درايف
          </a>
        </p>
      )}
      {error && (
        <div className="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
