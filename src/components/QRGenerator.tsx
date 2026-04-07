import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRDownloadButton from "./QRDownloadButton";
import styles from "../styles/QRGenerator.module.css";

export default function QRGenerator() {
  const [inputValue, setInputValue] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const qrRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.qrContainer}>
      <h1>منشئ رمز QR</h1>
      <p className={styles.subtitle}>حوّل أي نص أو رابط إلى رمز QR فوراً</p>

      <div className={styles.inputSection}>
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          placeholder="عنوان الصورة (اختياري)"
          className={styles.qrInput}
        />
      </div>

      <div className={styles.inputSection}>
        <input
          type="text"
          value={inputValue}
          dir="ltr"
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="أدخل نصاً أو رابطاً..."
          className={styles.qrInput}
          autoFocus
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
            <QRDownloadButton
              qrRef={qrRef}
              inputValue={inputValue}
              titleValue={titleValue}
            />
          </>
        )}
        {!inputValue && (
          <div className={styles.emptyState}>
            <p>أدخل نصاً أو رابطاً أعلاه لإنشاء رمز QR</p>
          </div>
        )}
      </div>
    </div>
  );
}
