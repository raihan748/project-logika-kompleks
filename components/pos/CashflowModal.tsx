"use client";

import React, { useState } from "react";
import { DollarSign, ArrowDownRight, ArrowUpRight, X, CheckCircle2 } from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";

interface CashflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashflowModal({ isOpen, onClose }: CashflowModalProps) {
  const { addCashflow, currency, language, t } = usePOS();
  const [type, setType] = useState<"KAS_MASUK" | "KAS_KELUAR">("KAS_KELUAR");
  const [category, setCategory] = useState<string>(language === "en" ? "Store Operating Expense" : "Beli Es Batu / Galon");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const categories = {
    KAS_KELUAR: language === "en" ? [
      "Store Operating Expense",
      "Electricity & Utilities",
      "Packaging & Shopping Bags",
      "Staff Meals / Refreshments",
      "Shipping / Freight Inward",
      "Other Expenses",
    ] : [
      "Beli Es Batu / Galon",
      "Token Listrik & Air Warung",
      "Uang Sampah & Kebersihan",
      "Beli Plastik / Kantong Kresek",
      "Konsumsi Kasir / Karyawan",
      "Transport / Ongkir Kulakan",
      "Lainnya",
    ],
    KAS_MASUK: language === "en" ? [
      "Initial Cash Drawer Float",
      "Owner Cash Injection",
      "Non-Sales Revenue",
      "Other Inflow",
    ] : [
      "Modal Kas Awal Toko",
      "Setoran Pemilik Toko",
      "Pendapatan Non-Penjualan",
      "Lainnya",
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    addCashflow(type, category, numAmount, notes);
    setAmount("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === "en" ? "Record Cashflow Entry" : "Catat Arus Kas Toko"}
              </h3>
              <p className="text-xs text-slate-500">
                {language === "en" ? "Track operating expenditures and cash drawer floats" : "Pencatatan pengeluaran operasional & modal kasir"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-thin">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType("KAS_KELUAR");
                setCategory(categories.KAS_KELUAR[0]);
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition active:scale-95 ${
                type === "KAS_KELUAR"
                  ? "bg-rose-50 border-rose-400 text-rose-700 shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>{language === "en" ? "Cash Out (Expense)" : "Kas Keluar (Biaya)"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("KAS_MASUK");
                setCategory(categories.KAS_MASUK[0]);
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition active:scale-95 ${
                type === "KAS_MASUK"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>{language === "en" ? "Cash In (Float/Inflow)" : "Kas Masuk (Modal)"}</span>
            </button>
          </div>

          {/* Category Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === "en" ? "Category:" : "Kategori Keperluan:"}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
            >
              {categories[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === "en" ? `Amount (${currency}):` : "Nominal (Rp):"}
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount..."
              className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-900 outline-none shadow-xs"
              required
              autoFocus
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">
              {language === "en" ? "Description / Notes:" : "Keterangan Tambahan:"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === "en" ? "Receipt / reason note..." : "Catatan belanja / keperluan..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
            />
          </div>

          {/* Submit Action */}
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
              <span>{language === "en" ? "Save Cash Entry" : "Simpan Catatan Kas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
