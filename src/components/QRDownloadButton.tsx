import type { RefObject } from 'react';

interface QRDownloadButtonProps {
  qrRef: RefObject<HTMLDivElement | null>;
  inputValue: string;
}

export default function QRDownloadButton({ qrRef, inputValue }: QRDownloadButtonProps) {
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg') as SVGSVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;

      // Create filename from input value (sanitized)
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
    img.src = 'data:image/svg+xml;base64,' + btoa(data);
  };

  return (
    <button onClick={handleDownload} className="download-button">
      ↓ Download as PNG
    </button>
  );
}
