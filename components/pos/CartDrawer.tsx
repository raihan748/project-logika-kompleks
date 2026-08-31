"use client";

import React, { useState } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { formatCurrency } from "../../lib/engine/currency-formatter";

interface CartDrawerProps {
  onOpenPaymentModal: () => void;
}

export function CartDrawer({ onOpenPaymentModal }: CartDrawerProps) {
  const {
    cart,
    subtotal,
    discountTotal,
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
    t,
  } = usePOS();

  const [editingDiscountLineId, setEditingDiscountLineId] = useState<string | null>(null);
  const [discountInputValue, setDiscountInputValue] = useState<string>("");

  const fmt = (num: number) => formatCurrency(num, currency);

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

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full space-y-3.5">
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
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
                    <Image
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
      <div className="space-y-3 pt-3 border-t border-slate-200/80">
        {/* Subtotal, Tax & Discount Breakdown */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>{t("pos.subtotal")}:</span>
            <span className="font-mono font-bold text-slate-800">{fmt(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>{t("pos.discount")}:</span>
              <span className="font-mono font-bold">-{fmt(discountTotal)}</span>
            </div>
          )}
          {settings.taxEnabled && (
            <div className="flex justify-between text-slate-600 font-medium">
              <span>{settings.taxName} ({settings.taxRate}%):</span>
              <span className="font-mono font-bold">+{fmt(taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
            <span className="font-bold text-sm">
              {appendingToInvoice ? t("payment.additionalPayment") : t("pos.totalPay")}
            </span>
            <span className="font-black text-xl sm:text-2xl font-mono text-brand-600">
              {fmt(grandTotal)}
            </span>
          </div>
        </div>

        {/* Quick Exact Cash Button */}
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
