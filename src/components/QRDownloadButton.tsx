import type { RefObject } from 'react';
import styles from '../styles/QRDownloadButton.module.css';

interface QRDownloadButtonProps {
  qrRef: RefObject<HTMLDivElement | null>;
  inputValue: string;
  titleValue: string;
}

export default function QRDownloadButton({ qrRef, inputValue, titleValue }: QRDownloadButtonProps) {
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg') as SVGSVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = svg.getBoundingClientRect();
    const PADDING = 20;
    const FONT_SIZE = 18;
    const TITLE_HEIGHT = titleValue ? FONT_SIZE + PADDING * 1.5 : 0;

    canvas.width = rect.width + PADDING * 2;
    canvas.height = rect.height + TITLE_HEIGHT + PADDING * 2;

    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title text
      if (titleValue) {
        ctx.fillStyle = '#18181b';
        ctx.font = `bold ${FONT_SIZE}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillText(titleValue, canvas.width / 2, PADDING + FONT_SIZE);
      }

      // QR code
      ctx.drawImage(img, PADDING, TITLE_HEIGHT + PADDING);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;

      const sanitizedValue = inputValue
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .slice(0, 20);

      link.download = `qr-${sanitizedValue || 'code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
  };

  return (
    <button onClick={handleDownload} className={styles.downloadButton}>
      ↓ تنزيل كصورة PNG
    </button>
  );
}
