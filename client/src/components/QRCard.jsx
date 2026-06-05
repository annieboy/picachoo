import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCard({ event }) {
  const canvasRef  = useRef(null);
  const [copied, setCopied] = useState(false);
  const guestUrl = `${window.location.origin}/e/${event.join_code}`;

  function download() {
    // Find the <canvas> rendered by QRCodeCanvas and export it as a PNG
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `picachoo-${event.join_code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="qr-card">
      {/* QR code */}
      <div className="qr-canvas-wrap" ref={canvasRef}>
        <QRCodeCanvas
          value={guestUrl}
          size={180}
          bgColor="#ffffff"
          fgColor="#18181b"
          level="M"
          includeMargin={true}
        />
      </div>

      {/* Info */}
      <div className="qr-info">
        <p className="qr-code-label">
          Scan to upload · <strong>{event.join_code}</strong>
        </p>
        <p className="qr-url">{guestUrl}</p>

        <div className="qr-actions">
          <button className="btn-secondary" onClick={copyLink}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
          <button className="btn-secondary" onClick={download}>
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
