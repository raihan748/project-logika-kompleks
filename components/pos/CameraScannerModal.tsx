"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraScannerModal({ isOpen, onClose }: CameraScannerModalProps) {
  const { products, scanBarcode } = usePOS();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize Camera Stream when modal is open
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCameraError(null);
      setFeedback(null);
      return;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          if (isMounted) {
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
          }
        } else {
          setCameraError("Perangkat tidak mendukung akses kamera browser.");
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError(
            err.name === "NotAllowedError"
              ? "Izin akses kamera ditolak. Berikan izin di browser Anda."
              : "Tidak dapat mengakses kamera perangkat."
          );
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatedScan = (barcode: string) => {
    const res = scanBarcode(barcode, 1);
    setFeedback({ success: res.success, message: res.message });
    if (res.success) {
      setTimeout(() => {
        setFeedback(null);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200/80 bg-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 border border-brand-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Pemindai Barcode Kamera
              </h3>
              <p className="text-xs text-slate-500">
                Arahkan kamera ke barcode produk toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport / Targeting Frame */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {cameraError ? (
              <div className="text-center p-4 text-slate-400 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-semibold text-slate-200">{cameraError}</p>
                <p className="text-slate-400">Gunakan opsi scan cepat di bawah untuk simulasi barcode.</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser Barcode Reticle Animation */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-4/5 h-3/5 border-2 border-brand-400/80 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-pulse" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_red]" />
                  </div>
                </div>

                <div className="absolute bottom-3 bg-black/60 backdrop-blur-xs text-white/90 text-[11px] font-medium px-3 py-1 rounded-full border border-white/10">
                  Posisikan barcode di dalam kotak merah
                </div>
              </>
            )}
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                feedback.success
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Quick Barcode Testing Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Simulasi Scan Barcode Nyata (1-Klik):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSimulatedScan(prod.sku)}
                  className="bg-white hover:bg-brand-50/70 border border-slate-200 hover:border-brand-300 p-2 rounded-xl text-left transition active:scale-95 shadow-xs"
                >
                  <p className="text-[11px] font-bold text-slate-900 truncate">
                    {prod.name}
                  </p>
                  <p className="text-[10px] font-mono text-brand-600 font-semibold">
                    {prod.sku}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
