"use client";

import React, { useState } from "react";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import { ReceiptModal } from "../../components/pos/ReceiptModal";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Search,
  Printer,
  Calendar,
} from "lucide-react";
import { Transaction } from "../../lib/types/pos";

export default function ReportsPage() {
  const { transactions } = usePOS();
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");

  const totalRevenue = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
  const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
  const totalDiscounts = transactions.reduce((sum, t) => sum + t.discountTotal, 0);
  const totalItemsSold = transactions.reduce(
    (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(search.toLowerCase())) ||
      t.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReceipt = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsReceiptOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner Header */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900">
                Laporan Penjualan & Laba Bersih
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Rekapitulasi omzet kotor, modal HPP, margin keuntungan, dan histori nota
              </p>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Omzet Penjualan</span>
              <DollarSign className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {formatRp(totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {transactions.length} Transaksi Tercatat
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Estimasi Laba Bersih (Net Profit)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {formatRp(totalProfit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Margin: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Barang Terjual</span>
              <ShoppingBag className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalItemsSold} Unit
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Produk keluar dari stok</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Diskon Diberikan</span>
              <span className="text-rose-600 font-bold text-xs">Promo</span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              {formatRp(totalDiscounts)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Potongan harga ke pelanggan</p>
          </div>
        </div>

        {/* Transactions Journal Table */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Jurnal Transaksi Kasir ({filteredTransactions.length})
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari No. Nota / Nama Pelanggan..."
                className="w-full bg-slate-100/70 border border-slate-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-slate-200">
              Belum ada transaksi penjualan yang tercatat. Selesaikan transaksi di Layar Kasir POS.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Nota</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4 text-center">Item</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Laba Bersih</th>
                    <th className="py-3 px-4 text-right">Total Bayar</th>
                    <th className="py-3 px-4 text-center">Struk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tx.customerName || "Umum"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {tx.items.length}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            tx.paymentMethod === "KASBON"
                              ? "bg-amber-100 text-amber-800"
                              : tx.paymentMethod === "QRIS"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatRp(tx.profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatRp(tx.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenReceipt(tx)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition shadow-2xs"
                          title="Lihat Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ReceiptModal
        transaction={selectedTx}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedTx(null);
        }}
      />
    </div>
  );
}
