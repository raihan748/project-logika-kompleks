"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ProductImage } from "../ui/ProductImage";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Zap,
  RotateCcw,
  Layers,
  X,
  UserCheck,
  UserPlus,
  Crown,
  Sparkles,
  Search,
  ChevronDown,
  Gift,
  Check,
  Percent,
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { formatCurrency } from "../../lib/engine/currency-formatter";
import { CustomerMember, MemberTier, MembershipType } from "../../lib/types/pos";

interface CartDrawerProps {
  onOpenPaymentModal: () => void;
}

export function CartDrawer({ onOpenPaymentModal }: CartDrawerProps) {
  const {
    cart,
    subtotal,
    discountTotal,
    memberDiscountAmount,
    pointsDiscountAmount,
    potentialPointsEarned,
    pointsToRedeem,
    taxTotal,
    grandTotal,
    currency,
    settings,
    appendingToInvoice,
    cancelAppendingToInvoice,
    appendItemsToTransaction,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    setCartItemDiscount,
    processCheckout,
    members,
    activeMember,
    setActiveMember,
    quickRegisterMember,
    t,
  } = usePOS();

  const [editingDiscountLineId, setEditingDiscountLineId] = useState<string | null>(null);
  const [discountInputValue, setDiscountInputValue] = useState<string>("");

  // Member Hub Bar States
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickType, setQuickType] = useState<MembershipType>("HYBRID");
  const [quickTier, setQuickTier] = useState<MemberTier>("REGULAR");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fmt = (num: number) => formatCurrency(num, currency);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered members for quick selection
  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm.trim()) return members.slice(0, 5);
    const q = memberSearchTerm.toLowerCase();
    const cleanDigits = memberSearchTerm.replace(/\D/g, "");
    return members
      .filter((m) => {
        if (m.name.toLowerCase().includes(q)) return true;
        if (m.memberCode.toLowerCase().includes(q)) return true;
        if (cleanDigits && m.phone.replace(/\D/g, "").includes(cleanDigits)) return true;
        return false;
      })
      .slice(0, 6);
  }, [members, memberSearchTerm]);

  // Handle 3-second quick register submit
  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) return;
    quickRegisterMember(quickPhone, quickName, quickTier, quickType);
    setShowQuickRegister(false);
    setShowMemberDropdown(false);
    setQuickPhone("");
    setQuickName("");
  };

  // Quick Exact Cash Checkout
  const handleQuickExactCash = () => {
    if (cart.length === 0) return;
    if (appendingToInvoice) {
      appendItemsToTransaction(appendingToInvoice, "TUNAI", grandTotal);
    } else {
      processCheckout("TUNAI", grandTotal);
    }
  };

  const handleApplyLineDiscount = (lineId: string) => {
    const val = parseFloat(discountInputValue) || 0;
    setCartItemDiscount(lineId, val);
    setEditingDiscountLineId(null);
    setDiscountInputValue("");
  };

  // Tier color styling badge
  const getTierBadgeStyle = (tier: MemberTier) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "GOLD":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "SILVER":
        return "bg-slate-200 text-slate-800 border-slate-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
      {/* Appending To Existing Invoice Active Banner */}
      {appendingToInvoice && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-amber-200 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-100">
                {t("pos.appendBanner")}
              </p>
              <p className="font-bold text-xs font-mono">{appendingToInvoice}</p>
            </div>
          </div>
          <button
            onClick={cancelAppendingToInvoice}
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white text-[10px] font-semibold flex items-center gap-1 transition"
            title={t("pos.cancelAppend")}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("pos.cancel")}</span>
          </button>
        </div>
      )}

      {/* Cart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200/70 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {appendingToInvoice ? "+ Tambahan Item Nota" : t("pos.cartTitle")}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {cart.length} {t("status.itemsAvailable")}
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Reset current order?")) {
                clearCart();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("pos.resetCart")}</span>
          </button>
        )}
      </div>

      {/* 🌟 CASHIER MEMBER HUB BAR 🌟 */}
      <div className="relative" ref={dropdownRef}>
        {activeMember ? (
          /* Active Member Selected Card */
          <div className="bg-gradient-to-r from-amber-500/10 via-brand-50/50 to-emerald-500/10 border border-amber-300/80 rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/30">
                <Crown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-xs truncate">
                    {activeMember.name}
                  </span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border uppercase tracking-wider ${getTierBadgeStyle(
                      activeMember.tier
                    )}`}
                  >
                    {activeMember.tier}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span className="font-mono text-slate-600 font-semibold">{activeMember.memberCode}</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {activeMember.points} Poin
                  </span>
                  {activeMember.discountPercent > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <Percent className="w-3 h-3 text-emerald-600" />
                        Diskon {activeMember.discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveMember(null)}
              className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition"
              title="Lepas Member"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Cashier Fast Detection & Select Bar */
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                className="flex-1 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 hover:border-brand-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between gap-1.5 transition shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-slate-600">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  <span>Pilih / Cek Member Pelanggan</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickRegister(true);
                  setShowMemberDropdown(false);
                }}
                className="bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-bold text-xs px-2.5 py-2 rounded-xl flex items-center gap-1 transition shadow-2xs whitespace-nowrap"
                title="Daftar Cepat Pelanggan Baru (3 Detik)"
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                <span className="hidden sm:inline">+ Daftar Cepat</span>
                <span className="sm:hidden">+ Baru</span>
              </button>
            </div>

            {/* Dropdown for Member Search & Fast Selection */}
            {showMemberDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl p-2.5 z-40 space-y-2 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    placeholder="Ketik No HP / Nama / Barcode..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredMembers.length === 0 ? (
                    <div className="py-3 text-center text-xs text-slate-400">
                      Member tidak ditemukan.
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPhone(memberSearchTerm);
                          setShowQuickRegister(true);
                          setShowMemberDropdown(false);
                        }}
                        className="block mx-auto mt-1.5 text-brand-600 font-bold hover:underline"
                      >
                        + Daftarkan "{memberSearchTerm}" Sekarang
                      </button>
                    </div>
                  ) : (
                    filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setActiveMember(m);
                          setShowMemberDropdown(false);
                          setMemberSearchTerm("");
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-brand-50/70 border border-transparent hover:border-brand-200 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-brand-700">
                              {m.name}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${getTierBadgeStyle(
                                m.tier
                              )}`}
                            >
                              {m.tier}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {m.phone} • {m.memberCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-amber-600 block">
                            {m.points} Poin
                          </span>
                          {m.discountPercent > 0 && (
                            <span className="text-[9px] font-semibold text-emerald-600">
                              Diskon {m.discountPercent}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3-Second Quick Register Modal / Overlay */}
      {showQuickRegister && (
        <div className="p-3 bg-brand-50/80 border border-brand-200/80 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <h4 className="font-bold text-xs text-slate-900">Daftar Kilat Member (3 Detik)</h4>
            </div>
            <button
              onClick={() => setShowQuickRegister(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleQuickRegisterSubmit} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="tel"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="Nomor HP (08...)*"
                required
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500"
                autoFocus
              />
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Nama Pelanggan"
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={quickTier}
                onChange={(e) => setQuickTier(e.target.value as MemberTier)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] text-slate-800 font-semibold outline-none"
              >
                <option value="REGULAR">Tier Regular (0%)</option>
                <option value="SILVER">Tier Silver (5%)</option>
                <option value="GOLD">Tier Gold (10%)</option>
                <option value="PLATINUM">Tier Platinum (15%)</option>
              </select>

              <select
                value={quickType}
                onChange={(e) => setQuickType(e.target.value as MembershipType)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] text-slate-800 font-semibold outline-none"
              >
                <option value="HYBRID">Hybrid (Poin + Diskon)</option>
                <option value="POINT">Poin Reward</option>
                <option value="POTONGAN">Potongan Harga</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs py-1.5 rounded-xl transition shadow-sm shadow-brand-600/30 flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Daftarkan & Pasang ke Keranjang</span>
            </button>
          </form>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 scrollbar-thin">
        {cart.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 stroke-[1.5] mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              {appendingToInvoice
                ? "Pilih barang tambahan yang ingin digabungkan ke nota"
                : t("pos.cartEmptyTitle")}
            </p>
            <p className="text-[11px] text-slate-400">{t("pos.cartEmptyDesc")}</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50/80 hover:bg-white border border-slate-200/70 hover:border-slate-300 rounded-2xl p-2.5 transition-all shadow-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                    <ProductImage
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                      {item.product.name}
                    </h5>
                    <p className="text-[11px] font-mono text-slate-500 font-medium">
                      {fmt(item.unitPrice)} /{item.product.unit}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeCartItem(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Controls & Line Subtotal */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-xs">
                {/* Quantity buttons */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => updateCartItemQty(item.id, -1, true)}
                    className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90"
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartItemQty(item.id, Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-8 text-center font-bold text-slate-900 outline-none"
                  />
                  <button
                    onClick={() => updateCartItemQty(item.id, 1, true)}
                    className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>

                {/* Subtotal & Discount toggle */}
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm font-mono">
                    {fmt(item.subtotal)}
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="text-[10px] font-bold text-rose-600">
                      -{fmt(item.discountAmount)}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Discount Input Accordion */}
              {editingDiscountLineId === item.id ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={discountInputValue}
                    onChange={(e) => setDiscountInputValue(e.target.value)}
                    placeholder="Discount amount..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleApplyLineDiscount(item.id)}
                    className="bg-brand-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg"
                  >
                    {t("pos.save")}
                  </button>
                  <button
                    onClick={() => setEditingDiscountLineId(null)}
                    className="text-slate-400 text-xs px-1"
                  >
                    {t("pos.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingDiscountLineId(item.id);
                    setDiscountInputValue(item.discountAmount.toString() || "");
                  }}
                  className="text-[10px] font-semibold text-brand-700 hover:underline flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>
                    {item.discountAmount > 0 ? t("pos.editDiscount") : t("pos.addDiscount")}
                  </span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Action */}
      <div className="space-y-2.5 pt-2.5 border-t border-slate-200/80">
        {/* Subtotal, Tax & Member Discount Breakdown */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>{t("pos.subtotal")}:</span>
            <span className="font-mono font-bold text-slate-800">{fmt(subtotal)}</span>
          </div>

          {/* Member Direct Tier Discount */}
          {memberDiscountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Diskon Member ({activeMember?.tier}):</span>
              </span>
              <span className="font-mono font-bold">-{fmt(memberDiscountAmount)}</span>
            </div>
          )}

          {/* Points Redeemed Discount */}
          {pointsDiscountAmount > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-500" />
                <span>Tukar {pointsToRedeem} Poin:</span>
              </span>
              <span className="font-mono font-bold">-{fmt(pointsDiscountAmount)}</span>
            </div>
          )}

          {/* Regular Item Level Discount */}
          {discountTotal > memberDiscountAmount + pointsDiscountAmount && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>{t("pos.discount")}:</span>
              <span className="font-mono font-bold">
                -{fmt(discountTotal - memberDiscountAmount - pointsDiscountAmount)}
              </span>
            </div>
          )}

          {settings.taxEnabled && (
            <div className="flex justify-between text-slate-600 font-medium">
              <span>
                {settings.taxName} ({settings.taxRate}%):
              </span>
              <span className="font-mono font-bold">+{fmt(taxTotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 text-slate-900">
            <div>
              <span className="font-bold text-sm block">
                {appendingToInvoice ? t("payment.additionalPayment") : t("pos.totalPay")}
              </span>
              {activeMember && potentialPointsEarned > 0 && (
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Dapat +{potentialPointsEarned} Poin
                </span>
              )}
            </div>
            <span className="font-black text-xl sm:text-2xl font-mono text-brand-600">
              {fmt(grandTotal)}
            </span>
          </div>
        </div>

        {/* Quick Exact Cash Button & Checkout Button */}
        {cart.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickExactCash}
              className="flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100/80 border border-brand-200 text-brand-700 font-bold text-xs py-2 rounded-xl transition active:scale-95 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 fill-brand-600 text-brand-600" />
              <span>{t("pos.exactCash")}</span>
            </button>

            <button
              onClick={onOpenPaymentModal}
              className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs py-2 rounded-xl transition active:scale-95 shadow-sm shadow-brand-600/30"
            >
              <span>{appendingToInvoice ? t("pos.confirmMerge") : t("pos.checkout")}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
