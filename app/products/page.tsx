"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Navbar } from "../../components/pos/Navbar";
import { usePOS } from "../../lib/store/pos-context";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  CheckCircle2,
} from "lucide-react";
import { Product, ProductCategory } from "../../lib/types/pos";
import { formatCurrency } from "../../lib/engine/currency-formatter";

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, exportProductsCSV, currency, language, t } = usePOS();

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ProductCategory>("sembako");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [imageUrl, setImageUrl] = useState("");

  const fmt = (num: number) => formatCurrency(num, currency);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.includes(search);
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setSku(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setCategory("sembako");
    setPrice("");
    setCostPrice("");
    setStock("50");
    setUnit("pcs");
    setImageUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setPrice(prod.price.toString());
    setCostPrice(prod.costPrice.toString());
    setStock(prod.stock.toString());
    setUnit(prod.unit);
    setImageUrl(prod.imageUrl);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price) || 0;
    const numCost = parseFloat(costPrice) || Math.round(numPrice * 0.75);
    const numStock = parseInt(stock) || 0;

    if (!name.trim() || numPrice <= 0) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        category,
        price: numPrice,
        costPrice: numCost,
        stock: numStock,
        unit,
        imageUrl: imageUrl.trim(),
      });
    } else {
      addProduct({
        name: name.trim(),
        sku: sku.trim() || `899${Date.now()}`,
        category,
        price: numPrice,
        costPrice: numCost,
        stock: numStock,
        minStockAlert: 5,
        unit,
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Page Banner Header */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl text-slate-900">
                  {language === "en" ? "Product & Stock Inventory" : "Manajemen Master Produk & Stok"}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {language === "en" ? "Manage selling prices, unit cost (COGS), and stock thresholds" : "Kelola harga jual, harga modal (HPP), dan batas stok minimum"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportProductsCSV}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{language === "en" ? "Export CSV" : "Ekspor CSV"}</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition active:scale-95 shadow-sm shadow-brand-600/30"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === "en" ? "+ Add Product" : "+ Tambah Barang Baru"}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "en" ? "Search barcode / product name..." : "Cari SKU barcode / nama produk..."}
              className="w-full bg-slate-100/70 border border-slate-200 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold">
            {[
              { id: "all", label: language === "en" ? "All" : "Semua" },
              { id: "sembako", label: language === "en" ? "Groceries" : "Sembako" },
              { id: "minuman", label: language === "en" ? "Beverages" : "Minuman" },
              { id: "snack", label: language === "en" ? "Snacks" : "Snack" },
              { id: "makanan_siap", label: language === "en" ? "Ready Food" : "Warung" },
              { id: "bumbu_dapur", label: language === "en" ? "Condiments" : "Bumbu" },
              { id: "perawatan", label: language === "en" ? "Care" : "Perawatan" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  selectedCat === c.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{language === "en" ? "Product" : "Barang"}</th>
                  <th className="py-3 px-4">Barcode / SKU</th>
                  <th className="py-3 px-4">{language === "en" ? "Category" : "Kategori"}</th>
                  <th className="py-3 px-4 text-right">{language === "en" ? "Cost (COGS)" : "Harga Modal"}</th>
                  <th className="py-3 px-4 text-right">{language === "en" ? "Selling Price" : "Harga Jual"}</th>
                  <th className="py-3 px-4 text-right">{language === "en" ? "Profit Margin" : "Untung"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Stock" : "Stok"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Action" : "Aksi"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((prod) => {
                  const margin = prod.price - prod.costPrice;
                  const isLowStock = prod.stock <= prod.minStockAlert;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <span className="text-[10px] text-slate-400">Unit: {prod.unit}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        {prod.sku}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 font-semibold">
                        {fmt(prod.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-brand-700 font-bold">
                        {fmt(prod.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                        +{fmt(margin)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            isLowStock
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arabica Roast 250g"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode / SKU:</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="899..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 font-mono font-semibold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-medium outline-none"
                  >
                    <option value="sembako">Groceries & Staples</option>
                    <option value="minuman">Beverages & Coffee</option>
                    <option value="snack">Snacks & Bakery</option>
                    <option value="makanan_siap">Ready to Eat / F&B</option>
                    <option value="bumbu_dapur">Condiments & Noodles</option>
                    <option value="perawatan">Personal Care</option>
                    <option value="lainnya">Others</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price / COGS ({currency}):</label>
                  <input
                    type="number"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="Cost..."
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price ({currency}):</label>
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price..."
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-brand-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock:</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / kg / bottle / pack"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Photo URL:</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-brand-500 rounded-xl px-3 py-2 text-slate-700 text-[11px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition active:scale-95 shadow-sm shadow-brand-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
