"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import { ReceiptModal } from "../../components/pos/ReceiptModal";
import { ProductImage } from "../../components/ui/ProductImage";
import {
  ReceiptText,
  Search,
  Printer,
  FileSpreadsheet,
  PlusCircle,
  Trash2,
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Crown,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Transaction, PaymentMethod } from "../../lib/types/pos";
import { formatCurrency, exportToCSV } from "../../lib/engine/currency-formatter";

export default function TransactionsPage() {
  const router = useRouter();
  const {
    transactions,
    deleteTransaction,
    startAppendingToInvoice,
    currency,
    language,
    t,
  } = usePOS();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fmt = (num: number) => formatCurrency(num, currency);

  // Date Filter Calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        tx.invoiceNumber.toLowerCase().includes(q) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
        tx.items.some((it) => it.product.name.toLowerCase().includes(q));

      // 2. Method Filter
      const matchesMethod =
        methodFilter === "ALL" || tx.paymentMethod === methodFilter;

      // 3. Date Filter
      const txTime = new Date(tx.timestamp).getTime();
      let matchesDate = true;
      if (dateFilter === "TODAY") {
        matchesDate = txTime >= todayStart;
      } else if (dateFilter === "7DAYS") {
        matchesDate = txTime >= sevenDaysAgo;
      } else if (dateFilter === "30DAYS") {
        matchesDate = txTime >= thirtyDaysAgo;
      }

      return matchesSearch && matchesMethod && matchesDate;
    });
  }, [transactions, search, methodFilter, dateFilter, todayStart, sevenDaysAgo, thirtyDaysAgo]);

  // Aggregate Stats
  const totalCount = filteredTransactions.length;
  const totalRevenue = filteredTransactions.reduce((acc, tx) => acc + tx.grandTotal, 0);
  const totalProfit = filteredTransactions.reduce((acc, tx) => acc + tx.profit, 0);
  const avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  const handleOpenReceipt = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsReceiptOpen(true);
  };

  const handleAppendToTransaction = (invoiceNumber: string) => {
    startAppendingToInvoice(invoiceNumber);
    router.push("/");
  };

  const handleDelete = (tx: Transaction) => {
    const confirmMsg =
      language === "en"
        ? `Are you sure you want to void/delete invoice ${tx.invoiceNumber}?`
        : `Apakah Anda yakin ingin menghapus / membatalkan nota ${tx.invoiceNumber}?`;

    if (window.confirm(confirmMsg)) {
      deleteTransaction(tx.id);
      if (expandedTxId === tx.id) setExpandedTxId(null);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredTransactions.map((t) => ({
      Invoice_Number: t.invoiceNumber,
      Waktu: t.timestamp,
      Pelanggan: t.customerName || "Umum",
      Member_Tier: t.memberTier || "-",
      Jumlah_Item: t.items.reduce((s, it) => s + it.quantity, 0),
      Metode_Bayar: t.paymentMethod,
      Subtotal: t.subtotal,
      Diskon_Total: t.discountTotal,
      Pajak: t.taxTotal || 0,
      Total_Bayar: t.grandTotal,
      Laba_Bersih: t.profit,
      Kasir: t.cashierName,
      Catatan: t.notes || "",
    }));
    exportToCSV(`WarungPro_Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const toggleExpand = (id: string) => {
    setExpandedTxId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20 flex items-center justify-center">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                {language === "en" ? "Transactions History" : "Riwayat Transaksi Penjualan"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {language === "en"
                  ? "Track, reprint receipts, merge items, or audit previous orders"
                  : "Pantau histori nota kasir, cetak ulang struk, tambah barang, dan audit penjualan"}
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-2xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{language === "en" ? "Export to CSV" : "Ekspor Riwayat (CSV)"}</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-glass-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "en" ? "Total Orders" : "Total Nota"}
              </span>
              <ReceiptText className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {totalCount}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "en" ? "Transactions completed" : "Transaksi berhasil"}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-glass-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "en" ? "Gross Revenue" : "Total Omzet"}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {fmt(totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "en" ? "Gross sales value" : "Nilai omzet kotor"}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-glass-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "en" ? "Net Profit" : "Laba Bersih"}
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
              {fmt(totalProfit)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "en" ? "After COGS & Tax" : "Setelah dikurangi HPP"}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-glass-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "en" ? "Avg. Order (AOV)" : "Rata-rata Nota"}
              </span>
              <Package className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 font-mono">
              {fmt(avgOrderValue)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "en" ? "Average ticket size" : "Rata-rata per transaksi"}
            </p>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === "en"
                  ? "Search by Invoice #, Customer name, or Item..."
                  : "Cari No. Nota, Nama Pelanggan, atau Nama Barang..."
              }
              className="w-full bg-slate-100/70 border border-slate-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 outline-none transition"
            />
          </div>

          {/* Date & Payment Method Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">{language === "en" ? "All Dates" : "Semua Waktu"}</option>
              <option value="TODAY">{language === "en" ? "Today" : "Hari Ini"}</option>
              <option value="7DAYS">{language === "en" ? "Last 7 Days" : "7 Hari Terakhir"}</option>
              <option value="30DAYS">{language === "en" ? "Last 30 Days" : "30 Hari Terakhir"}</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">{language === "en" ? "All Methods" : "Semua Metode"}</option>
              <option value="TUNAI">TUNAI / CASH</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="CARD">KARTU (DEBIT/KREDIT)</option>
              <option value="KASBON">KASBON / HUTANG</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              {language === "en" ? "Transaction Records" : "Daftar Riwayat Penjualan"} (
              {filteredTransactions.length})
            </h3>
            <span className="text-xs text-slate-400">
              {language === "en" ? "Click row to expand details" : "Klik baris untuk melihat rincian barang"}
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <ReceiptText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600 text-sm">
                {language === "en" ? "No transactions found" : "Tidak ada transaksi yang cocok"}
              </p>
              <p>
                {language === "en"
                  ? "Try adjusting your search query or date filter."
                  : "Coba ubah kata kunci pencarian atau filter rentang tanggal."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isExpanded = expandedTxId === tx.id;
                const totalItemQty = tx.items.reduce((s, it) => s + it.quantity, 0);

                return (
                  <div key={tx.id} className="transition hover:bg-slate-50/60">
                    {/* Main Row */}
                    <div
                      onClick={() => toggleExpand(tx.id)}
                      className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Left: Invoice & Time */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-brand-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-slate-900">
                              {tx.invoiceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                tx.paymentMethod === "KASBON"
                                  ? "bg-amber-100 text-amber-800"
                                  : tx.paymentMethod === "QRIS"
                                  ? "bg-teal-100 text-teal-800"
                                  : tx.paymentMethod === "CARD"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {tx.paymentMethod}
                            </span>
                            {tx.memberTier && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-amber-500/20">
                                <Crown className="w-3 h-3 text-amber-600" />
                                {tx.memberTier}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>
                              {new Date(tx.timestamp).toLocaleString(
                                language === "en" ? "en-US" : "id-ID"
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {language === "en" ? "Customer:" : "Pelanggan:"}{" "}
                              <strong className="text-slate-700 font-semibold">
                                {tx.customerName || (language === "en" ? "General" : "Umum")}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              {totalItemQty} {language === "en" ? "items" : "barang"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amounts & Quick Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-right">
                          <div className="font-mono font-black text-slate-900 text-base">
                            {fmt(tx.grandTotal)}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-600 font-semibold">
                            +{fmt(tx.profit)} {language === "en" ? "profit" : "laba"}
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenReceipt(tx)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                            title="Cetak / Lihat Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {language === "en" ? "Receipt" : "Struk"}
                            </span>
                          </button>

                          <button
                            onClick={() => handleAppendToTransaction(tx.invoiceNumber)}
                            className="p-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                            title="Tambah Barang ke Nota Ini"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {language === "en" ? "Append" : "+ Tambah"}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition"
                            title="Hapus / Batalkan Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Item Details Accordion */}
                    {isExpanded && (
                      <div className="bg-slate-50/90 border-t border-slate-200/80 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-brand-500" />
                          <span>
                            {language === "en" ? "Itemized Breakdown" : "Rincian Barang Belanjaan"}
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tx.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                <ProductImage
                                  src={it.product.imageUrl}
                                  alt={it.product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-slate-900 truncate">
                                  {it.product.name}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {it.quantity} x {fmt(it.unitPrice)}
                                </p>
                                {it.discountAmount > 0 && (
                                  <p className="text-[10px] text-rose-600 font-semibold">
                                    Diskon: -{fmt(it.discountAmount)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right font-mono font-bold text-xs text-slate-900">
                                {fmt(it.subtotal)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Breakdown summary */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-400">Kasir: </span>
                            <span className="font-bold text-slate-700">{tx.cashierName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Subtotal: </span>
                            <span className="font-bold text-slate-700">{fmt(tx.subtotal)}</span>
                          </div>
                          {tx.discountTotal > 0 && (
                            <div>
                              <span className="text-slate-400">Diskon: </span>
                              <span className="font-bold text-rose-600">
                                -{fmt(tx.discountTotal)}
                              </span>
                            </div>
                          )}
                          {tx.taxTotal > 0 && (
                            <div>
                              <span className="text-slate-400">PPN / Pajak: </span>
                              <span className="font-bold text-slate-700">{fmt(tx.taxTotal)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400">Dibayar: </span>
                            <span className="font-bold text-slate-700">{fmt(tx.amountPaid)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Kembalian: </span>
                            <span className="font-bold text-emerald-600">
                              {fmt(tx.changeDue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Thermal Receipt Modal */}
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
