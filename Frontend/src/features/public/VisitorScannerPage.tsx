import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import {
  ArrowLeft,
  FlipHorizontal,
  VideoOff,
  Power,
  Keyboard,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Users,
  Phone,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  RotateCcw,
  Store
} from 'lucide-react';
import { BRAND } from '../../config/brand';
import { visitorApiClient, VisitorApiError, getVisitorProfile } from '../../data/api/visitorApiClient';

interface ScannedConnection {
  type: 'VISITOR' | 'EXHIBITOR';
  id: string;
  visitorId?: string;
  exhibitorId?: string;
  registrationNumber: string;
  name?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
  fasciaName?: string | null;
  stallNumber?: string | null;
  contactPersonName?: string | null;
  contactPersonDesignation?: string | null;
  designation?: string | null;
  email?: string | null;
  mobile?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  industryCategory?: string | null;
  connectedAt?: string;
}

// Extracts code from either stall URL, visitor pass URL, or bare registration number
function extractScannedCode(text: string): string {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    const vIdx = segments.findIndex(
      (s) => s.toLowerCase() === 'visitorverification' || s.toLowerCase() === 'visitor'
    );
    if (vIdx !== -1 && segments[vIdx + 1]) {
      return decodeURIComponent(segments[vIdx + 1]);
    }
    const sIdx = segments.findIndex((s) => s.toLowerCase() === 'stall');
    if (sIdx !== -1 && segments[sIdx + 1]) {
      return decodeURIComponent(segments[sIdx + 1]);
    }
    if (segments.length > 0) {
      return decodeURIComponent(segments[segments.length - 1]);
    }
  } catch {
    // Plain code or pass number
  }
  return trimmed;
}

export function VisitorScannerPage() {
  const navigate = useNavigate();
  const visitorProfile = getVisitorProfile();

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedConnection, setScannedConnection] = useState<ScannedConnection | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isProcessingRef = useRef(false);

  const handleConnect = async (rawText: string) => {
    if (isProcessingRef.current) return;
    const code = extractScannedCode(rawText);
    if (!code) return;

    isProcessingRef.current = true;
    setScanning(true);
    setScanError(null);

    try {
      // Audio beep sound on scan
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch {
        // Audio not allowed without user interaction
      }

      const connection = await visitorApiClient.post<ScannedConnection>(
        '/public/visitors/scan',
        {
          visitorId: visitorProfile?.visitorId,
          registrationNumber: code
        }
      );

      setScannedConnection(connection);
    } catch (err: any) {
      console.error('Scan connection error:', err);
      if (err instanceof VisitorApiError && err.status === 404) {
        setScanError(`No visitor or stall found matching '${code}'. Please verify the QR code or registration number.`);
      } else {
        setScanError(err?.message || 'Unable to complete connection. Please try again.');
      }
    } finally {
      setScanning(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  useEffect(() => {
    if (!isCameraOn || scannedConnection) {
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
      video: { facingMode: facingMode === 'user' ? 'user' : { ideal: 'environment' } }
    };

    codeReader
      .decodeFromConstraints(constraints, videoRef.current!, (result: Result | null) => {
        if (result && !isProcessingRef.current && !scannedConnection) {
          handleConnect(result.getText());
        }
      })
      .catch((err) => {
        console.error('Visitor scanner camera error:', err);
        setCameraError('Unable to start camera. Check camera permission for this site.');
        setIsCameraOn(false);
      });

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn, facingMode, scannedConnection]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleConnect(manualCode.trim());
      setManualCode('');
      setManualMode(false);
    }
  };

  const resetForNextScan = () => {
    setScannedConnection(null);
    setScanError(null);
    isProcessingRef.current = false;
    setIsCameraOn(true);
  };

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-slate-950 p-0 md:p-6 font-sans">
      <div className="relative flex flex-col h-[100dvh] md:h-[800px] w-full md:max-w-md bg-slate-900 md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">

        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-slate-800/80 text-white backdrop-blur-md hover:bg-slate-700 transition"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <p className="text-xs font-bold uppercase tracking-widest text-white/90">
            {scannedConnection ? 'Connection Captured' : 'Scan Stall or Visitor QR'}
          </p>

          {isCameraOn && !scannedConnection ? (
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="p-2.5 rounded-full bg-slate-800/80 text-white backdrop-blur-md hover:bg-slate-700 transition"
              title="Flip Camera"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Viewfinder / Camera Screen */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black overflow-hidden">
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${!isCameraOn || scannedConnection ? 'hidden' : ''} ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />

          {isCameraOn && !scannedConnection ? (
            <div className="relative z-10 w-64 h-64 rounded-2xl border-2 border-white/20 overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#3b82f6] animate-[scan_2s_infinite_linear]" />
            </div>
          ) : !scannedConnection ? (
            <div className="z-10 flex flex-col items-center text-center p-6 max-w-xs">
              <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Scan Stall or Visitor QR</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Scan an Exhibitor's stall QR or another Visitor's badge to exchange contacts and connect.
              </p>
              <button
                onClick={() => setIsCameraOn(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg transition active:scale-95"
              >
                <Power className="w-4 h-4" />
                Turn On Camera
              </button>
            </div>
          ) : null}

          {/* Camera Controls Overlay */}
          {isCameraOn && !scannedConnection && (
            <button
              onClick={() => setIsCameraOn(false)}
              className="absolute bottom-6 z-20 flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs rounded-full backdrop-blur-md transition"
            >
              <VideoOff className="w-3.5 h-3.5" />
              Turn Off Camera
            </button>
          )}

          {/* Scanning spinner */}
          {scanning && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-white">Connecting...</p>
            </div>
          )}

          {/* Camera Permission Error */}
          {cameraError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/95 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-sm font-medium text-slate-200">{cameraError}</p>
            </div>
          )}

          {/* SUCCESSFUL CONNECTION MODAL CARD */}
          {scannedConnection && (
            <div className="absolute inset-0 z-40 flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {scannedConnection.type === 'EXHIBITOR' ? 'Exhibitor Connected' : 'Visitor Connected'}
                      </span>
                      <p className="text-xs text-slate-400">{scannedConnection.registrationNumber}</p>
                    </div>
                  </div>

                  {scannedConnection.stallNumber && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                      <Store size={12} /> Stall {scannedConnection.stallNumber}
                    </span>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-white">
                    {scannedConnection.name || scannedConnection.contactPersonName || scannedConnection.companyName || 'Connected Partner'}
                  </h4>

                  {scannedConnection.companyName && (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{scannedConnection.companyName}</span>
                    </div>
                  )}

                  {scannedConnection.designation && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{scannedConnection.designation}</span>
                    </div>
                  )}

                  {(scannedConnection.city || scannedConnection.district) && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{[scannedConnection.city, scannedConnection.district, scannedConnection.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {scannedConnection.industryCategory && (
                    <div className="inline-block mt-1">
                      <span className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                        {scannedConnection.industryCategory}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons (Call, Email) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  {scannedConnection.mobile ? (
                    <a
                      href={`tel:${scannedConnection.mobile}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  ) : (
                    <button disabled className="py-2 px-3 bg-slate-800/40 text-slate-600 rounded-xl text-xs font-bold opacity-50">
                      Call
                    </button>
                  )}

                  {scannedConnection.email ? (
                    <a
                      href={`mailto:${scannedConnection.email}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  ) : (
                    <button disabled className="py-2 px-3 bg-slate-800/40 text-slate-600 rounded-xl text-xs font-bold opacity-50">
                      Email
                    </button>
                  )}
                </div>

                {/* Primary Navigation Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {scannedConnection.type === 'EXHIBITOR' && (
                    <Link
                      to={`/stall/${encodeURIComponent(scannedConnection.registrationNumber)}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      <Store className="w-4 h-4" /> View Public Stall Profile
                    </Link>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={resetForNextScan}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Scan Next
                    </button>

                    <Link
                      to={
                        scannedConnection.type === 'EXHIBITOR'
                          ? '/visitorShell/Connections?tab=exhibitors'
                          : '/visitorShell/Connections?tab=visitors'
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      <Users className="w-4 h-4" /> My Connections
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Manual entry & Error display */}
        <div className="z-30 p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
          {scanError && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 flex-1">{scanError}</p>
              <button onClick={() => setScanError(null)} className="text-xs text-red-400 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {manualMode ? (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter pass ID or stall number..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded-xl font-bold transition">
                Connect
              </button>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="px-3 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setManualMode(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
              >
                <Keyboard className="w-4 h-4" />
                Enter Code / Pass ID
              </button>

              <Link
                to="/visitorShell/Connections"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-blue-400 text-xs font-bold rounded-xl border border-slate-700/80 transition"
              >
                <Users className="w-4 h-4" /> Connections
              </Link>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-500">{BRAND.eventName}</p>
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
