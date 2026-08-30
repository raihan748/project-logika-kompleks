"use client";

import React, { useState } from "react";
import { PlusCircle, X, CheckCircle2 } from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";

interface ManualItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualItemModal({ isOpen, onClose }: ManualItemModalProps) {
  const { addManualItemToCart, currency, language, t } = usePOS();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price) || 0;
    const numQty = parseInt(qty) || 1;

    if (!name.trim() || numPrice <= 0) return;

    addManualItemToCart(name.trim(), numPrice, numQty);
    setName("");
    setPrice("");
    setQty("1");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === "en" ? "Add Custom / Unlisted Item" : "Tambah Item Manual / Bebas"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "en" ? "Quick on-the-fly item without scanning barcode" : "Item dadakan tanpa perlu scan barcode"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === "en" ? "Item Name / Description:" : "Nama Barang / Menu:"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "en" ? "e.g. Special Coffee / Bakery Set" : "Contoh: Es Teh Manis / Gorengan"}
              className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {language === "en" ? `Unit Price (${currency}):` : "Harga Satuan (Rp):"}
              </label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5.00"
                className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {language === "en" ? "Quantity (Qty):" : "Jumlah (Qty):"}
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              {t("pos.cancel")}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition active:scale-95 shadow-sm shadow-brand-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === "en" ? "Add to Cart" : "Masuk Keranjang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
