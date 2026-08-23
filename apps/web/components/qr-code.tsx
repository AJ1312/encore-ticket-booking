'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

export function QRCodeDisplay({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCodeLib.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(url => setDataUrl(url))
      .catch(err => {
        console.error('QR generation error:', err);
      });
  }, [value, size]);

  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#ffffff',
        padding: 8,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code for ${value}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <div style={{ font: '10px var(--mono)', color: '#000' }}>Generating QR…</div>
      )}
    </div>
  );
}
