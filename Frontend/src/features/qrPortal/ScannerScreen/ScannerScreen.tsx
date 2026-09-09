import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { 
  Camera, ArrowLeft, FlipHorizontal, Barcode, Smartphone, 
  ExternalLink, AlertTriangle, Keyboard, VideoOff, Power,
  Users, CheckCircle2, Loader2, UserCheck
} from 'lucide-react';
import { apiClient, ApiError } from '../../../data/api/apiClient';
import PresentVisitorsGrid from './PresentVisitorGrid';
// import PresentVisitorsGrid from './PresentVisitorsGrid';


const TENANT_ID = '11111111-1111-1111-1111-111111111111';

type CheckInStatus =
  | { state: 'loading'; registrationNumber: string }
  | { state: 'success'; registrationNumber: string; legalName: string; contactPersonName: string; alreadyCheckedIn: boolean }
  | { state: 'error'; registrationNumber: string; message: string };

export default function ControlledScannerScreen() {
  const [inputMode, setInputMode] = useState<'camera' | 'lbp'>('camera');
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false); // CAMERA OFF BY DEFAULT
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scannedResult, setScannedResult] = useState<{ text: string; isUrl: boolean; source: string } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [view, setView] = useState<'scan' | 'present'>('scan');
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [presentRefreshSignal, setPresentRefreshSignal] = useState(0);
  const lastCheckedRef = useRef<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Helper function to check if string is a valid HTTP/HTTPS URL
  const checkIsValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  // Pulls a visitor registration number out of a scanned value. Handles both
  // the full visitor-pass verification URL (…/visitorverification/VISITOR-HOSUR-1000)
  // and a bare registration number typed/scanned directly (LBP pistols, manual entry).
  const extractRegistrationNumber = (text: string): string | null => {
    const trimmed = text.trim();
    if (checkIsValidUrl(trimmed)) {
      try {
        const url = new URL(trimmed);
        const segments = url.pathname.split('/').filter(Boolean);
        const idx = segments.findIndex((s) => s.toLowerCase() === 'visitorverification');
        if (idx !== -1 && segments[idx + 1]) {
          return decodeURIComponent(segments[idx + 1]).toUpperCase();
        }
      } catch {
        return null;
      }
      return null;
    }
    if (/^VISITOR-/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    return null;
  };

  const performCheckIn = useCallback(async (registrationNumber: string) => {
    setCheckInStatus({ state: 'loading', registrationNumber });
    try {
      const result = await apiClient.post<{
        registrationNumber: string;
        legalName: string;
        contactPersonName: string;
        wasAlreadyCheckedIn: boolean;
      }>('/visitors/checkin', { tenantId: TENANT_ID, registrationNumber });

      setCheckInStatus({
        state: 'success',
        registrationNumber: result.registrationNumber,
        legalName: result.legalName,
        contactPersonName: result.contactPersonName,
        alreadyCheckedIn: result.wasAlreadyCheckedIn
      });
      setPresentRefreshSignal((n) => n + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection.';
      setCheckInStatus({ state: 'error', registrationNumber, message });
    }
  }, []);

  // Whenever a fresh scan/manual entry comes in, try to auto check the visitor in.
  useEffect(() => {
    if (!scannedResult) return;
    const regNumber = extractRegistrationNumber(scannedResult.text);
    if (!regNumber || lastCheckedRef.current === `${regNumber}:${scannedResult.text}`) return;
    lastCheckedRef.current = `${regNumber}:${scannedResult.text}`;
    performCheckIn(regNumber);
  }, [scannedResult, performCheckIn]);

  // 1. Initialize Real-time ZXing Camera Decoder ONLY when camera is turned ON
  useEffect(() => {
    if (inputMode !== 'camera' || !isCameraOn) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    setCameraError(null);

    const constraints = {
      video: {
        facingMode: facingMode === 'user' ? 'user' : { ideal: 'environment' }
      }
    };

    codeReader.decodeFromConstraints(constraints, videoRef.current!, (result: Result | null) => {
      if (result) {
        const text = result.getText();
        setScannedResult({
          text: text,
          isUrl: checkIsValidUrl(text),
          source: 'Camera Stream'
        });
      }
    }).catch((err) => {
      console.error('Camera Scanner Error:', err);
      setCameraError('Unable to start camera. Check permissions or camera availability.');
      setIsCameraOn(false);
    });

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, [facingMode, inputMode, isCameraOn]);

  // 2. Hardware LBP (Laser Barcode Pistol Keyboard Wedge Listener)
  useEffect(() => {
    let lbpBuffer = '';
    //@ts-ignore
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (lbpBuffer.trim().length > 0) {
          const text = lbpBuffer.trim();
          setScannedResult({
            text: text,
            isUrl: checkIsValidUrl(text),
            source: 'LBP Scanner'
          });
          lbpBuffer = '';
        }
      } else if (e.key.length === 1) {
        lbpBuffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { lbpBuffer = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedResult({
        text: manualCode.trim(),
        isUrl: checkIsValidUrl(manualCode.trim()),
        source: 'Manual Key-in'
      });
      setManualCode('');
      setManualMode(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950 p-0 md:p-6 font-sans">
      <div className="relative flex flex-col h-screen md:h-[800px] w-full md:max-w-md bg-slate-900 md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Controls Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
          <button className="p-2.5 rounded-full bg-slate-800/80 text-white backdrop-blur-md">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Input Mode Selector */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            <button
              onClick={() => setInputMode('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                inputMode === 'camera' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Camera
            </button>
            {/* <button
              onClick={() => {
                setInputMode('lbp');
                setIsCameraOn(false); // Turn off camera when switching to LBP
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                inputMode === 'lbp' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              LBP Pistol
            </button> */}
          </div>

          <div className="flex items-center gap-2">
            {inputMode === 'camera' && isCameraOn && view === 'scan' && (
              <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                className="p-2.5 rounded-full bg-slate-800/80 text-white backdrop-blur-md hover:bg-slate-700 transition"
                title="Flip Camera"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setView(prev => prev === 'scan' ? 'present' : 'scan')}
              className={`p-2.5 rounded-full backdrop-blur-md transition ${
                view === 'present' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-white hover:bg-slate-700'
              }`}
              title="Present Visitors"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Main Stage */}
        <div className={`relative flex-1 flex flex-col items-center justify-center bg-black overflow-hidden ${view === 'present' ? 'hidden' : ''}`}>
          {inputMode === 'camera' ? (
            <>
              {/* Active Video Stream Element */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${
                  !isCameraOn ? 'hidden' : ''
                } ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {isCameraOn ? (
                /* Scanning Reticle Frame (Only active when camera is ON) */
                <div className="relative z-10 w-64 h-64 rounded-2xl border-2 border-white/20 overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]">
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-[scan_2s_infinite_linear]" />
                </div>
              ) : (
                /* Camera Disabled Offline State Overlay */
                <div className="z-10 flex flex-col items-center text-center p-6 max-w-xs">
                  <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
                    <VideoOff className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Camera is Off</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    Camera stream is inactive to save battery. Turn camera on to scan QR codes or URLs visually.
                  </p>
                  <button
                    onClick={() => setIsCameraOn(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition active:scale-95"
                  >
                    <Power className="w-4 h-4" />
                    Turn On Camera
                  </button>
                </div>
              )}

              {/* Turn Off Button when camera is active */}
              {isCameraOn && (
                <button
                  onClick={() => setIsCameraOn(false)}
                  className="absolute bottom-6 z-20 flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs rounded-full backdrop-blur-md transition"
                >
                  <VideoOff className="w-3.5 h-3.5" />
                  Turn Off Camera
                </button>
              )}

              {cameraError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/95 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
                  <p className="text-sm font-medium text-slate-200">{cameraError}</p>
                </div>
              )}
            </>
          ) : (
            /* LBP Mode View */
            <div className="z-10 flex flex-col items-center text-center p-8">
              <Barcode className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
              <h3 className="text-base font-semibold text-white">LBP Scanner Active</h3>
              <p className="text-xs text-slate-400 mt-1">Scan tags using your handheld USB/Bluetooth pistol scanner.</p>
            </div>
          )}
        </div>

        {/* Present Visitors Grid Panel */}
        {view === 'present' && (
          <div className="flex-1 min-h-0 bg-slate-950">
            <PresentVisitorsGrid refreshSignal={presentRefreshSignal} />
          </div>
        )}

        {/* Scanned Results & Manual Entry Bottom Sheet */}
        <div className={`z-30 p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3 ${view === 'present' ? 'hidden' : ''}`}>
          {checkInStatus && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                checkInStatus.state === 'loading'
                  ? 'bg-slate-800/90 border-slate-700'
                  : checkInStatus.state === 'error'
                  ? 'bg-red-950/60 border-red-800'
                  : checkInStatus.alreadyCheckedIn
                  ? 'bg-amber-950/60 border-amber-800'
                  : 'bg-emerald-950/60 border-emerald-800'
              }`}
            >
              {checkInStatus.state === 'loading' && <Loader2 className="w-5 h-5 text-slate-300 animate-spin shrink-0" />}
              {checkInStatus.state === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
              {checkInStatus.state === 'success' && checkInStatus.alreadyCheckedIn && <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />}
              {checkInStatus.state === 'success' && !checkInStatus.alreadyCheckedIn && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}

              <div className="flex-1 min-w-0">
                {checkInStatus.state === 'loading' && (
                  <p className="text-xs font-semibold text-slate-200">Checking in {checkInStatus.registrationNumber}…</p>
                )}
                {checkInStatus.state === 'error' && (
                  <>
                    <p className="text-xs font-semibold text-red-300">{checkInStatus.registrationNumber}</p>
                    <p className="text-[11px] text-red-400/90">{checkInStatus.message}</p>
                  </>
                )}
                {checkInStatus.state === 'success' && (
                  <>
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {checkInStatus.legalName} • {checkInStatus.contactPersonName}
                    </p>
                    <p className={`text-[11px] ${checkInStatus.alreadyCheckedIn ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {checkInStatus.registrationNumber} — {checkInStatus.alreadyCheckedIn ? 'Already checked in' : 'Marked Present ✓'}
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={() => setCheckInStatus(null)}
                className="text-xs text-slate-400 hover:text-white shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {scannedResult && !extractRegistrationNumber(scannedResult.text) && (
            <div className="p-3.5 bg-slate-800/90 border border-slate-700 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                  {scannedResult.source} • {scannedResult.isUrl ? 'Web URL Detected' : 'Text / Barcode'}
                </span>
                <button 
                  onClick={() => setScannedResult(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <p className="text-sm font-mono font-medium text-slate-100 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {scannedResult.text}
              </p>

              {scannedResult.isUrl ? (
                <a
                  href={scannedResult.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-emerald-950"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open URL Link
                </a>
              ) : (
                <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Scanned text is not a valid http/https URL link.
                </p>
              )}
            </div>
          )}

          {manualMode ? (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste URL or SKU code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                autoFocus
              />
              <button type="submit" className="px-3.5 py-2 bg-indigo-600 text-xs text-white rounded-xl font-medium">Submit</button>
              <button type="button" onClick={() => setManualMode(false)} className="px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Cancel</button>
            </form>
          ) : (
            <button
              onClick={() => setManualMode(true)}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700"
            >
              <Keyboard className="w-4 h-4" />
              Manual Paste / Entry
            </button>
          )}
        </div>

      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(250px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}