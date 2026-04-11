import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRDownloadButton from './QRDownloadButton';
import FileUploadQR from './FileUploadQR';
import styles from '../styles/QRGenerator.module.css';

type Mode = 'text' | 'file';

export default function QRGenerator() {
  const [mode, setMode] = useState<Mode>('text');
  const [inputValue, setInputValue] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const qrRef = useRef<HTMLDivElement | null>(null);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setInputValue('');
  };

  return (
    <div className={styles.qrContainer}>
      <h1>منشئ رمز QR</h1>
      <p className={styles.subtitle}>حوّل أي نص أو رابط أو ملف إلى رمز QR فوراً</p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'text' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('text')}
        >
          نص أو رابط
        </button>
        <button
          type="button"
          className={mode === 'file' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('file')}
        >
          ملف من جوجل درايف
        </button>
      </div>

      {mode === 'text' ? (
        <div className={styles.inputSection}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="أدخل نصاً أو رابطاً..."
            className={styles.qrInput}
            autoFocus
          />
        </div>
      ) : (
        <FileUploadQR onUploaded={setInputValue} currentLink={inputValue} />
      )}

      <div className={styles.inputSection}>
        <input
          type="text"
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          placeholder="عنوان الصورة (اختياري)"
          className={styles.qrInput}
        />
      </div>

      <div className={styles.qrDisplaySection}>
        {inputValue && (
          <>
            <div className={styles.qrCodeWrapper} ref={qrRef}>
              {titleValue && <p className={styles.qrTitle}>{titleValue}</p>}
              <QRCodeSVG
                value={inputValue}
                size={256}
                level="H"
                marginSize={4}
              />
            </div>
            <QRDownloadButton qrRef={qrRef} inputValue={inputValue} titleValue={titleValue} />
          </>
        )}
        {!inputValue && (
          <div className={styles.emptyState}>
            <p>
              {mode === 'text'
                ? 'أدخل نصاً أو رابطاً أعلاه لإنشاء رمز QR'
                : 'سجّل الدخول وارفع ملفاً لإنشاء رمز QR'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
