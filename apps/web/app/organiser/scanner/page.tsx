'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiJson } from '@/lib/api';
import { PortalNav } from '@/components/portal-nav';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // We only want to render the scanner if we haven't just scanned something successfully
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        // Stop scanning after a successful read to prevent spamming
        scanner.pause(true);
        setLoading(true);
        setError(null);
        setSuccessMsg('');

        try {
          // decodedText is expected to be the token itself if our QR code encodes just the token
          // Or if it's a URL, we can extract the token
          let token = decodedText;
          if (decodedText.includes('/verify/')) {
            token = decodedText.split('/verify/')[1];
          }

          const res = await apiJson<{ booking: any }>(`/verify/${token}`);
          setScanResult({ ...res.booking, token });
        } catch (err: any) {
          setError(err.message || 'Invalid or cancelled ticket');
          setTimeout(() => scanner.resume(), 3000); // resume after 3 seconds
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        // ignore scan frame errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult]);

  async function handleCheckin() {
    if (!scanResult) return;
    setCheckingIn(true);
    setError(null);
    try {
      const seatIds = scanResult.seats.map((s: any) => s.id);
      await apiJson(`/verify/${scanResult.token}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ seatIds }),
      });
      setSuccessMsg('Successfully checked in!');
      setScanResult(null); // Reset to scan next
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  }

  function resetScanner() {
    setScanResult(null);
    setError(null);
    setSuccessMsg('');
  }

  return (
    <div className="min-h-screen bg-[#0e1012] text-white">
      <PortalNav />
      <main className="max-w-md mx-auto p-6 pt-24">
        <h1 className="text-2xl font-bold mb-6 font-mono text-center">QR Scanner</h1>

        {successMsg && (
          <div className="mb-6 p-4 bg-[#1c3624] border border-[#3a7750] text-[#d8f3dc] rounded-lg flex items-center gap-3">
            <CheckCircle2 size={24} />
            <p className="font-mono text-sm">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#3d241c] border border-[#e07a5f] text-[#ffd8cc] rounded-lg flex items-center gap-3">
            <AlertCircle size={24} />
            <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {!scanResult && (
          <div className="bg-[#14171a] p-4 rounded-xl border border-[#23272d]">
            <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
            {loading && <p className="text-center mt-4 text-[#748cab] font-mono text-sm">Verifying ticket...</p>}
          </div>
        )}

        {scanResult && (
          <div className="bg-[#14171a] p-6 rounded-xl border border-[#23272d] flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#f8f9fa]">{scanResult.eventTitle}</h2>
            <div className="flex flex-col gap-1 text-sm text-[#748cab] font-mono">
              <p>Booking Ref: <strong className="text-white">{scanResult.bookingRef}</strong></p>
              <p>Customer: <strong className="text-white">{scanResult.customerName} ({scanResult.customerEmail})</strong></p>
              <p>Status: <strong className="text-[var(--coral)] uppercase">{scanResult.status}</strong></p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-[#748cab] mb-2 font-mono">Seats:</p>
              <div className="flex flex-wrap gap-2">
                {scanResult.seats?.map((s: any) => (
                  <span key={s.id} className="px-3 py-1 bg-[#23272d] rounded-md font-mono text-xs border border-[#415a77]">
                    {s.section} - Row {s.row} - Seat {s.number}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetScanner}
                className="flex-1 py-3 px-4 bg-[#23272d] hover:bg-[#343a40] transition-colors rounded-lg font-mono text-sm border border-[#415a77] flex justify-center items-center gap-2"
              >
                <RefreshCw size={16} /> Cancel
              </button>
              <button
                onClick={handleCheckin}
                disabled={checkingIn || scanResult.status !== 'confirmed'}
                className="flex-1 py-3 px-4 bg-[var(--coral)] hover:bg-[var(--peach)] disabled:opacity-50 text-[#14171a] transition-colors rounded-lg font-bold font-mono text-sm flex justify-center items-center gap-2"
              >
                {checkingIn ? 'Processing...' : 'Confirm Check-in'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
