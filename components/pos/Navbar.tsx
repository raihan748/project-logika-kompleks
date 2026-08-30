"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Package,
  BookOpen,
  DollarSign,
  BarChart3,
  Clock,
  Wifi,
  WifiOff,
  Download,
  RotateCcw,
  Store,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";

interface NavbarProps {
  onOpenCashflowModal?: () => void;
  onTriggerInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export function Navbar({ onOpenCashflowModal, onTriggerInstallPwa, canInstallPwa }: NavbarProps) {
  const pathname = usePathname();
  const { settings, isOnline, cart, debts, resetToSampleData } = usePOS();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) +
          ", " +
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalUnpaidDebts = debts.filter((d) => d.remainingDebt > 0).length;

  const navItems = [
    { href: "/", label: "Kasir POS", icon: ShoppingBag, badge: cart.length > 0 ? cart.length : null },
    { href: "/products", label: "Katalog Produk", icon: Package },
    { href: "/debts", label: "Buku Kasbon", icon: BookOpen, badge: totalUnpaidDebts > 0 ? totalUnpaidDebts : null },
    { href: "/cashflow", label: "Buku Kas Toko", icon: DollarSign },
    { href: "/reports", label: "Laporan Laba Rugi", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/75 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all">
      {/* Top Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Store Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Store className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                {settings.storeName}
              </span>
              <span className="text-[10px] uppercase font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                WarungPro
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate max-w-[260px]">
              {settings.address}
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/60 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>{currentTime || "Memuat..."}</span>
          </div>

          {/* Sync status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          {canInstallPwa && (
            <button
              onClick={onTriggerInstallPwa}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-brand-600 hover:from-teal-500 hover:to-brand-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-brand-500/20 transition active:scale-95"
              title="Pasang aplikasi ke layar beranda HP / Desktop"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install Aplikasi</span>
            </button>
          )}

          {/* Catat Kas Cepat */}
          {onOpenCashflowModal && (
            <button
              onClick={onOpenCashflowModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow-sm"
              title="Catat Kas Masuk atau Kas Keluar Toko"
            >
              <DollarSign className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden md:inline">Catat Kas</span>
            </button>
          )}

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm("Reset data katalog & transaksi ke sampel bawaan?")) {
                resetToSampleData();
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Reset Data Sampel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto text-xs font-semibold py-1.5 scrollbar-none border-t border-slate-100">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-brand-50 text-brand-700 font-bold border border-brand-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-brand-600 stroke-[2.5]" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  className={`ml-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
