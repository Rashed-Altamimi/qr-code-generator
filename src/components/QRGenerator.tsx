import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRDownloadButton from './QRDownloadButton';
import '../styles/QRGenerator.css';

export default function QRGenerator() {
  const [inputValue, setInputValue] = useState('');
  const qrRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="qr-container">
      <h1>QR Code Generator</h1>
      <p className="subtitle">Convert any text or URL into a QR code instantly</p>

      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter text or URL..."
          className="qr-input"
          autoFocus
        />
      </div>

      <div className="qr-display-section">
        {inputValue && (
          <>
            <div className="qr-code-wrapper" ref={qrRef}>
              <QRCodeSVG
                value={inputValue}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <QRDownloadButton qrRef={qrRef} inputValue={inputValue} />
          </>
        )}
        {!inputValue && (
          <div className="empty-state">
            <p>Enter text or URL above to generate a QR code</p>
          </div>
        )}
      </div>
    </div>
  );
}
