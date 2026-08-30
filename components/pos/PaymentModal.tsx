"use client";

import React, { useState } from "react";
import {
  Banknote,
  QrCode,
  CreditCard,
  BookOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { PaymentMethod } from "../../lib/types/pos";
import { getQuickCashSuggestions } from "../../lib/engine/coin-changer";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { grandTotal, processCheckout } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TUNAI");
  const [cashTendered, setCashTendered] = useState<string>(grandTotal.toString());
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const numCashTendered = parseInt(cashTendered) || 0;
  const changeDue = Math.max(0, numCashTendered - grandTotal);
  const isCashSufficient = numCashTendered >= grandTotal;
  const quickCashSuggestions = getQuickCashSuggestions(grandTotal);

  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (paymentMethod === "KASBON") {
      if (!customerName.trim()) {
        setErrorMessage("Nama pelanggan wajib diisi untuk transaksi Kasbon.");
        return;
      }
    } else if (paymentMethod === "TUNAI") {
      if (!isCashSufficient) {
        setErrorMessage(`Nominal uang yang diterima kurang ${formatRp(grandTotal - numCashTendered)}`);
        return;
      }
    }

    const res = processCheckout(
      paymentMethod,
      numCashTendered,
      customerName,
      customerPhone,
      notes
    );

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message || "Gagal memproses pembayaran.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200/80 bg-white/60">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Penerimaan Pembayaran
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Pilih metode dan konfirmasi nominal pembayaran
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Total Tagihan Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Tagihan Bersih</span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                {formatRp(grandTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Metode Terpilih:</span>
              <div className="font-bold text-white uppercase mt-0.5">{paymentMethod}</div>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "TUNAI", label: "Tunai / Cash", icon: Banknote },
              { id: "QRIS", label: "QRIS Digital", icon: QrCode },
              { id: "TRANSFER", label: "Transfer", icon: CreditCard },
              { id: "KASBON", label: "Kasbon / Hutang", icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = paymentMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(tab.id as PaymentMethod);
                    if (tab.id !== "TUNAI") setCashTendered(grandTotal.toString());
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition active:scale-95 text-center ${
                    isSelected
                      ? "bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="text-[11px] leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Method Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. TUNAI CASH OPTION */}
            {paymentMethod === "TUNAI" && (
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nominal Uang Diterima (Rp):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 outline-none shadow-xs"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Pecahan Uang Cepat:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {quickCashSuggestions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashTendered(amount.toString())}
                        className="bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] font-mono font-bold text-slate-800 shadow-2xs active:scale-95 transition"
                      >
                        {amount === grandTotal ? "Uang Pas" : formatRp(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Due Display */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700">Uang Kembalian:</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      isCashSufficient ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isCashSufficient
                      ? formatRp(changeDue)
                      : `Kurang ${formatRp(grandTotal - numCashTendered)}`}
                  </span>
                </div>
              </div>
            )}

            {/* 2. QRIS OPTION */}
            {paymentMethod === "QRIS" && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-2xl border border-slate-300 shadow-sm flex flex-col items-center justify-center">
                  <QrCode className="w-28 h-28 text-slate-900" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    QRIS Standar
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                  <p className="font-bold text-slate-900">Scan dengan Aplikasi E-Wallet / Mobile Banking</p>
                  <p className="text-[11px] text-slate-500">
                    GoPay • OVO • DANA • ShopeePay • BCA Mobile • Mandiri Livin
                  </p>
                </div>
              </div>
            )}

            {/* 3. TRANSFER OPTION */}
            {paymentMethod === "TRANSFER" && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800">Nomor Rekening Toko:</p>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono font-medium text-slate-800">
                  <div className="flex justify-between">
                    <span>BCA:</span>
                    <span className="font-bold text-brand-600">123-456-7890</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mandiri:</span>
                    <span className="font-bold text-brand-600">137-00-9876543-2</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-sans pt-1 border-t border-slate-100">
                    <span>Atas Nama:</span>
                    <span className="font-bold text-slate-700">Warung Berkah Jaya</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. KASBON / HUTANG PELANGGAN OPTION */}
            {paymentMethod === "KASBON" && (
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>Pencatatan Buku Kasbon Pelanggan</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-amber-950 font-bold block mb-1">
                      Nama Pelanggan (Wajib):
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Pak RT / Bu Siti"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-amber-950 font-semibold block mb-1">
                      No. WhatsApp / Telepon:
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional Customer Name & Notes for Cash/QRIS */}
            {paymentMethod !== "KASBON" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Nama Pelanggan:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Opsional (Umum)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">No. WhatsApp:</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Untuk kirim nota..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition active:scale-95 shadow-md shadow-brand-600/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan Transaksi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
