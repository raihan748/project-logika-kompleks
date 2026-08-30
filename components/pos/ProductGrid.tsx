"use client";

import React from "react";
import Image from "next/image";
import { Plus, AlertTriangle, Check } from "lucide-react";
import { usePOS } from "../../lib/store/pos-context";
import { formatCurrency } from "../../lib/engine/currency-formatter";

export function ProductGrid() {
  const { products, activeCategory, searchQuery, addToCart, cart, currency, t } = usePOS();

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const fmt = (num: number) => formatCurrency(num, currency);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>
          {t("nav.products")} ({filteredProducts.length} {t("status.itemsAvailable")})
        </span>
        <span>{t("pos.tapToAdd")}</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 space-y-2">
          <p className="text-sm font-bold text-slate-700">{t("pos.noProducts")}</p>
          <p className="text-xs text-slate-400">{t("pos.noProductsDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredProducts.map((product) => {
            const inCartItem = cart.find((it) => it.product.id === product.id);
            const isLowStock = product.stock <= product.minStockAlert;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product, 1)}
                className="group relative bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-brand-400 shadow-glass-sm hover:shadow-glass rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 active:scale-98"
              >
                {/* Product Image & Badges Container */}
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Quantity In Cart Badge */}
                  {inCartItem && (
                    <div className="absolute top-1.5 right-1.5 bg-brand-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 animate-in zoom-in-75">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{inCartItem.quantity}</span>
                    </div>
                  )}

                  {/* Low Stock Warning Badge */}
                  {isLowStock && (
                    <div className="absolute bottom-1.5 left-1.5 bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{product.stock} left</span>
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-[13px] leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <div>
                      <span className="font-extrabold text-brand-600 text-xs sm:text-sm tracking-tight">
                        {fmt(product.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        /{product.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-brand-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                      title="Add to order"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
