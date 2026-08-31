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
  Building,
  Layers,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { PaymentMethod } from "../../lib/types/pos";
import { formatCurrency, getUniversalQuickCash } from "../../lib/engine/currency-formatter";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const {
    grandTotal,
    processCheckout,
    appendItemsToTransaction,
    appendingToInvoice,
    currency,
    settings,
    t,
  } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TUNAI");
  const [cashTendered, setCashTendered] = useState<string>(grandTotal.toString());
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const numCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numCashTendered - grandTotal);
  const isCashSufficient = numCashTendered >= grandTotal;
  const quickCashSuggestions = getUniversalQuickCash(grandTotal, currency);

  const fmt = (num: number) => formatCurrency(num, currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (paymentMethod === "KASBON") {
      if (!customerName.trim() && !appendingToInvoice) {
        setErrorMessage(t("payment.requiredForDebt"));
        return;
      }
    } else if (paymentMethod === "TUNAI") {
      if (!isCashSufficient) {
        setErrorMessage(`${t("payment.insufficientCash")} ${fmt(grandTotal - numCashTendered)}`);
        return;
      }
    }

    let res: { success: boolean; message?: string };

    if (appendingToInvoice) {
      res = appendItemsToTransaction(
        appendingToInvoice,
        paymentMethod,
        numCashTendered,
        notes
      );
    } else {
      res = processCheckout(
        paymentMethod,
        numCashTendered,
        customerName,
        customerPhone,
        notes
      );
    }

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message || "Payment process failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              {appendingToInvoice ? t("pos.confirmMerge") : t("payment.modalTitle")}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {appendingToInvoice
                ? `${t("payment.mergingWithInvoice")} ${appendingToInvoice}`
                : t("payment.modalSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Appending Invoice Mode Indicator Card */}
          {appendingToInvoice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-2xl flex items-center gap-2 text-xs">
              <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Mode Penambahan Nota Aktif: </span>
                <span>Barang belanjaan baru akan disatukan ke invoice </span>
                <span className="font-mono font-bold text-amber-800">{appendingToInvoice}</span>
              </div>
            </div>
          )}

          {/* Total Tagihan Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">
                {appendingToInvoice ? t("payment.additionalPayment") : t("payment.totalBill")}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
                {fmt(grandTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>{t("payment.selectedMethod")}:</span>
              <div className="font-bold text-white uppercase mt-0.5">{paymentMethod}</div>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { id: "TUNAI", label: t("payment.cash"), icon: Banknote },
              { id: "CARD", label: t("payment.card"), icon: CreditCard },
              { id: "QRIS", label: t("payment.qr"), icon: QrCode },
              { id: "TRANSFER", label: t("payment.transfer"), icon: Building },
              { id: "KASBON", label: t("payment.debt"), icon: BookOpen },
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
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition active:scale-95 text-center ${
                    isSelected
                      ? "bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="text-[10px] sm:text-[11px] leading-tight truncate w-full">{tab.label}</span>
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
                    {t("payment.amountReceived")}:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 outline-none shadow-xs"
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">{t("payment.quickCash")}:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {quickCashSuggestions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashTendered(amount.toString())}
                        className="bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] font-mono font-bold text-slate-800 shadow-2xs active:scale-95 transition"
                      >
                        {amount === grandTotal ? t("pos.exactCash") : fmt(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Due Display */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700">{t("payment.changeDue")}:</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      isCashSufficient ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isCashSufficient
                      ? fmt(changeDue)
                      : `${t("payment.insufficientCash")} ${fmt(grandTotal - numCashTendered)}`}
                  </span>
                </div>
              </div>
            )}

            {/* 2. CARD / POS TERMINAL */}
            {paymentMethod === "CARD" && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-brand-600 mx-auto" />
                <p className="font-bold text-slate-900 text-xs sm:text-sm">
                  Swipe / Tap on External POS EDC Terminal
                </p>
                <p className="text-xs text-slate-500">
                  Accepts Visa, Mastercard, AMEX, Apple Pay, Google Pay, and Debit Cards.
                </p>
              </div>
            )}

            {/* 3. QRIS / QR WALLET */}
            {paymentMethod === "QRIS" && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex flex-col items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Universal QR
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                  <p className="font-bold text-slate-900">Scan via Digital Wallet / Banking App</p>
                  <p className="text-[11px] text-slate-500">
                    QRIS • PayPal • WeChat Pay • Cash App • Venmo
                  </p>
                </div>
              </div>
            )}

            {/* 4. TRANSFER OPTION */}
            {paymentMethod === "TRANSFER" && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800">Business Bank Accounts:</p>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono font-medium text-slate-800">
                  <div className="flex justify-between">
                    <span>Global Wire / IBAN:</span>
                    <span className="font-bold text-brand-600">US89 3704 0044 0532 0130 00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SWIFT / BIC:</span>
                    <span className="font-bold text-brand-600">WPGBUS33</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-sans pt-1 border-t border-slate-100">
                    <span>Beneficiary:</span>
                    <span className="font-bold text-slate-700">{settings.storeName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. KASBON / STORE CREDIT */}
            {paymentMethod === "KASBON" && (
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>{t("payment.debt")}</span>
                </div>

                {!appendingToInvoice && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-amber-950 font-bold block mb-1">
                        {t("payment.customerName")} (Required):
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer name..."
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-amber-950 font-semibold block mb-1">
                        {t("payment.customerPhone")}:
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 / +62..."
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
                {appendingToInvoice && (
                  <p className="text-amber-800 text-[11px]">
                    Tambahan tagihan kasbon akan otomatis ditambahkan ke catatan hutang pelanggan pada nota ini.
                  </p>
                )}
              </div>
            )}

            {/* Optional Customer Name & Phone for Cash/Card when not merging */}
            {paymentMethod !== "KASBON" && !appendingToInvoice && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">{t("payment.customerName")}:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">{t("payment.customerPhone")}:</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="For WhatsApp receipt..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Notes / Reason */}
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Catatan Tambahan (Opsional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={appendingToInvoice ? "Contoh: Tambah 1 Indomie + 1 Teh" : "Catatan transaksi..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none text-xs"
              />
            </div>

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
                {t("pos.cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition active:scale-95 shadow-md shadow-brand-600/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{appendingToInvoice ? t("pos.confirmMerge") : t("payment.finishTransaction")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
