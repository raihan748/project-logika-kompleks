"use client";

import React, { useState } from "react";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { CashflowModal } from "../../components/pos/CashflowModal";

export default function CashflowPage() {
  const { cashflow } = usePOS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");

  const totalIn = cashflow
    .filter((c) => c.type === "KAS_MASUK")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOut = cashflow
    .filter((c) => c.type === "KAS_KELUAR")
    .reduce((sum, c) => sum + c.amount, 0);

  const netBalance = totalIn - totalOut;

  const filteredRecords = cashflow.filter(
    (c) => filterType === "all" || c.type === filterType
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onOpenCashflowModal={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner Header */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl text-slate-900">
                Buku Kas Masuk & Kas Keluar Toko
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Pencatatan pengeluaran harian, biaya operasional, dan modal kasir
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition active:scale-95 shadow-sm shadow-brand-600/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat Arus Kas</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">Total Kas Masuk (Modal/Lain)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              +{formatRp(totalIn)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Uang kas yang ditambahkan</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">Total Kas Keluar (Biaya Toko)</span>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              -{formatRp(totalOut)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Belanja operasional warung</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4">
            <span className="text-xs text-slate-500 font-medium">Saldo Kas Bersih Buku</span>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                netBalance >= 0 ? "text-slate-900" : "text-rose-600"
              }`}
            >
              {formatRp(netBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Selisih Kas Masuk vs Kas Keluar</p>
          </div>
        </div>

        {/* Cashflow Log Table */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Riwayat Arus Kas ({filteredRecords.length})
            </h3>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {[
                { id: "all", label: "Semua" },
                { id: "KAS_MASUK", label: "Kas Masuk (+)" },
                { id: "KAS_KELUAR", label: "Kas Keluar (-)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterType === f.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-slate-200">
              Belum ada catatan arus kas. Klik &quot;Catat Arus Kas&quot; untuk menambah.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Kategori Keperluan</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.map((item) => {
                    const isIncoming = item.type === "KAS_MASUK";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(item.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isIncoming
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600 stroke-[2.5]" />
                            )}
                            <span>{isIncoming ? "KAS MASUK" : "KAS KELUAR"}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                        <td className="py-3 px-4 text-slate-500">{item.notes || "-"}</td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                            isIncoming ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIncoming ? "+" : "-"}
                          {formatRp(item.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <CashflowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
