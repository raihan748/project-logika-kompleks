"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      alert("Aplikasi dapat dipasang via menu browser Anda (Pilih 'Tambahkan ke Layar Utama' / 'Install App').");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, triggerInstall };
}

export function InstallPwaBanner() {
  const { isInstallable, triggerInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // If dismissed or already standalone, hide
  if (isDismissed) return null;

  return (
    <aside aria-label="Instalasi Aplikasi" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xl text-white border border-white/20 shadow-2xl rounded-2xl p-3.5 transition-all animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
            <Image
              src="/icon.svg"
              alt="WarungPro Icon"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm leading-tight text-white">
              Install WarungPro ke HP
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Buka kasir lebih cepat & berfungsi saat offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerInstall}
            className="bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition active:scale-95 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Pasang</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
