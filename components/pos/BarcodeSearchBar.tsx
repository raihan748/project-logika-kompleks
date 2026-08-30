"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Camera,
  Barcode,
  PlusCircle,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { ProductCategory } from "../../lib/types/pos";

interface BarcodeSearchBarProps {
  onOpenCameraScanner: () => void;
  onOpenManualItemModal: () => void;
}

export function BarcodeSearchBar({
  onOpenCameraScanner,
  onOpenManualItemModal,
}: BarcodeSearchBarProps) {
  const {
    scanBarcode,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
  } = usePOS();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanMultiplier, setScanMultiplier] = useState(1);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "Semua Produk" },
    { id: "sembako", label: "Sembako & Beras" },
    { id: "minuman", label: "Minuman Dingin" },
    { id: "snack", label: "Makanan Ringan" },
    { id: "makanan_siap", label: "Menu Warung" },
    { id: "bumbu_dapur", label: "Bumbu & Mie" },
    { id: "perawatan", label: "Perawatan" },
  ];

  // Submit barcode scanner input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const res = scanBarcode(barcodeInput, scanMultiplier);
    setFeedback({ success: res.success, message: res.message });
    setBarcodeInput("");
    setScanMultiplier(1);

    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  return (
    <div className="space-y-3">
      {/* Search and Scanner Input Row */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Barcode / Search Input Form */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode EAN-13 / Ketik nama produk..."
              className="w-full bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition shadow-inner-glow"
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => setBarcodeInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Multiplier / Quantity Selector */}
          <div className="flex items-center bg-slate-100/70 border border-slate-200 rounded-xl px-2 py-1 text-xs">
            <span className="text-slate-400 font-semibold mr-1.5">Qty:</span>
            <input
              type="number"
              min="1"
              max="999"
              value={scanMultiplier}
              onChange={(e) => setScanMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 bg-transparent text-center font-bold text-slate-900 outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition active:scale-95 shadow-sm shadow-brand-600/30"
          >
            Enter / Scan
          </button>
        </form>

        {/* Action Buttons: Camera Scanner & Manual Custom Item */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCameraScanner}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition active:scale-95 shadow-sm"
          >
            <Camera className="w-4 h-4 text-brand-400" />
            <span>Kamera</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualItemModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition active:scale-95 shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>+ Item Bebas</span>
          </button>
        </div>
      </div>

      {/* Instant Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 ${
            feedback.success
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-xs"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
