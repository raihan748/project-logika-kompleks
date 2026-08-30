"use client";

import React, { useState } from "react";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import {
  BookOpen,
  Search,
  DollarSign,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
} from "lucide-react";
import { CustomerDebt } from "../../lib/types/pos";
import { formatCurrency } from "../../lib/engine/currency-formatter";

export default function DebtsPage() {
  const { debts, recordDebtPayment, settings, currency, language } = usePOS();
  const [search, setSearch] = useState("");
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const fmt = (num: number) => formatCurrency(num, currency);

  const filteredDebts = debts.filter(
    (d) =>
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.customerPhone.includes(search)
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + d.remainingDebt, 0);
  const totalPaidBack = debts.reduce(
    (sum, d) => sum + (d.totalDebt - d.remainingDebt),
    0
  );

  const handleOpenPay = (d: CustomerDebt) => {
    setSelectedDebt(d);
    setPayAmount(d.remainingDebt.toString());
    setPayNotes(language === "en" ? "Credit Installment / Repayment" : "Cicilan / Pelunasan Kasbon");
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const numAmount = parseFloat(payAmount) || 0;
    if (numAmount <= 0) return;

    recordDebtPayment(selectedDebt.id, numAmount, payNotes);
    setSelectedDebt(null);
  };

  const handleSendReminderWA = (d: CustomerDebt) => {
    const cleanPhone = d.customerPhone.replace(/\D/g, "");
    let text = `${language === "en" ? "Hello" : "Halo"} *${d.customerName}*,\n\n`;
    text += `${language === "en" ? "Friendly reminder for your store tab balance at" : "Mengingatkan catatan kasbon belanja di"} *${settings.storeName}*: *${fmt(d.remainingDebt)}*.\n`;
    text += `${language === "en" ? "Thank you for your business!" : "Terima kasih banyak!"} 🙏`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner Header */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900">
                {language === "en" ? "Customer Credit & Accounts Receivable" : "Buku Kasbon & Piutang Pelanggan"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {language === "en" ? "Store credit tracking, partial repayments, and automated WhatsApp reminders" : "Pencatatan kasbon belanja warung, cicilan pelunasan, dan tagihan WhatsApp"}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">{language === "en" ? "Outstanding Balance" : "Total Kasbon Belum Lunas"}</span>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              {fmt(totalOutstanding)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {debts.filter((d) => d.remainingDebt > 0).length} {language === "en" ? "customers" : "orang pelanggan"}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">{language === "en" ? "Total Repaid" : "Total Sudah Dilunasi"}</span>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {fmt(totalPaidBack)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{language === "en" ? "Collected revenue" : "Uang kasbon yang sudah kembali"}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">{language === "en" ? "Total Cumulative Credit" : "Akumulasi Kasbon Dicatat"}</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {fmt(totalOutstanding + totalPaidBack)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{language === "en" ? "Historical store credit" : "Total histori kasbon tercatat"}</p>
          </div>
        </div>

        {/* Debtors List Table */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {language === "en" ? "Customer Accounts" : "Daftar Catatan Kasbon"} ({filteredDebts.length})
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "en" ? "Search customer name / phone..." : "Cari nama pelanggan / No. HP..."}
                className="w-full bg-slate-100/70 border border-slate-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          {filteredDebts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-slate-200">
              {language === "en" ? "No credit accounts found." : "Tidak ada catatan kasbon yang sesuai."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDebts.map((debt) => {
                const isPaidOff = debt.remainingDebt <= 0;
                const isExpanded = expandedDebtId === debt.id;

                return (
                  <div
                    key={debt.id}
                    className="bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl p-4 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {debt.customerName}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isPaidOff
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isPaidOff
                              ? language === "en"
                                ? "SETTLED"
                                : "LUNAS"
                              : language === "en"
                              ? "UNPAID"
                              : "BELUM LUNAS"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {debt.customerPhone || "No Phone"} • Invoices: {debt.relatedInvoices.join(", ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-medium">{language === "en" ? "Balance Due:" : "Sisa Hutang:"}</span>
                          <div className="text-base font-black font-mono text-rose-600">
                            {fmt(debt.remainingDebt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isPaidOff && (
                            <>
                              <button
                                onClick={() => handleOpenPay(debt)}
                                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition active:scale-95 shadow-xs flex items-center gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>{language === "en" ? "Record Payment" : "Bayar Cicilan"}</span>
                              </button>

                              <button
                                onClick={() => handleSendReminderWA(debt)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs p-2 rounded-xl transition"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() =>
                              setExpandedDebtId(isExpanded ? null : debt.id)
                            }
                            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition"
                            title="View history"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Payment History */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                        <span className="font-bold text-slate-700">{language === "en" ? "Payment History:" : "Riwayat Pembayaran Cicilan:"}</span>
                        {debt.payments.length === 0 ? (
                          <p className="text-slate-400 text-[11px]">No repayments recorded yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {debt.payments.map((pay) => (
                              <div
                                key={pay.id}
                                className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]"
                              >
                                <span className="text-slate-500 font-medium">
                                  {new Date(pay.date).toLocaleString(language === "en" ? "en-US" : "id-ID")} • {pay.notes || "Installment"}
                                </span>
                                <span className="font-mono font-bold text-emerald-600">
                                  +{fmt(pay.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Repay Debt Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === "en" ? "Record Tab Repayment" : "Catat Pembayaran Kasbon"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedDebt.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex justify-between items-baseline">
                <span className="text-rose-800 font-semibold">{language === "en" ? "Current Balance Due:" : "Sisa Hutang Saat Ini:"}</span>
                <span className="font-mono font-black text-rose-700 text-base">
                  {fmt(selectedDebt.remainingDebt)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {language === "en" ? `Amount Received (${currency}):` : "Nominal Pembayaran Diterima (Rp):"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 outline-none shadow-xs"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">{language === "en" ? "Notes:" : "Catatan / Keterangan:"}</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition active:scale-95 shadow-sm shadow-brand-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
