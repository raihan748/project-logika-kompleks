"use client";

import React, { useState } from "react";
import {
  Printer,
  Download,
  CheckCircle2,
  X,
  MessageCircle,
  Copy,
  Check,
  PlusCircle,
  Layers,
} from "lucide-react";
import { Transaction } from "../../lib/types/pos";
import { usePOS } from "../../lib/store/pos-context";
import {
  generateThermalReceiptText,
  generateWhatsAppMessage,
} from "../../lib/engine/receipt-helpers";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  const { settings, startAppendingToInvoice, t } = usePOS();
  const [copied, setCopied] = useState(false);
  const [waPhone, setWaPhone] = useState(transaction?.customerPhone || "");

  if (!isOpen || !transaction) return null;

  const rawReceipt = generateThermalReceiptText(transaction, settings);
  const waMessageEncoded = generateWhatsAppMessage(transaction, settings);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([rawReceipt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt-${transaction.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = (waPhone || transaction.customerPhone || "").replace(/\D/g, "");
    let waUrl = `https://wa.me/${cleanPhone}?text=${waMessageEncoded}`;
    if (!cleanPhone) {
      waUrl = `https://wa.me/?text=${waMessageEncoded}`;
    }
    window.open(waUrl, "_blank");
  };

  const handleAppendMore = () => {
    startAppendingToInvoice(transaction.invoiceNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t("receipt.successTitle")}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {transaction.invoiceNumber}
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

        {/* Receipt Content Scrollable Viewport */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Append More Items Prompt Card */}
          <div className="bg-brand-50/80 border border-brand-200/90 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <Layers className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-950">Pelanggan mau tambah barang?</p>
                <p className="text-[11px] text-brand-700">Gabungkan item baru ke nota {transaction.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={handleAppendMore}
              className="bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition active:scale-95 shadow-xs whitespace-nowrap flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Tambah</span>
            </button>
          </div>

          {/* Thermal Paper Monospace Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre font-medium overflow-x-auto">
            {rawReceipt}
          </div>

          {/* Quick WhatsApp Share Section */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>{t("receipt.sendWhatsApp")}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+1 / +62..."
                className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <button
                onClick={handleOpenWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
              title="Copy Receipt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? t("receipt.copied") : t("receipt.copy")}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
              title="Download Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("receipt.download")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t("receipt.printThermal")}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-sm"
            >
              {t("receipt.newTransaction")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
