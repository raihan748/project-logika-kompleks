"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Product,
  CartItem,
  Transaction,
  CustomerDebt,
  CashflowRecord,
  StoreSettings,
  PaymentMethod,
} from "../types/pos";
import { INITIAL_UMKM_PRODUCTS, DEFAULT_STORE_SETTINGS } from "../data/umkm-catalog";
import { posAudio } from "../engine/sound-effects";
import { SupportedCurrency, SupportedLanguage, TRANSLATIONS, CURRENCY_CONFIGS } from "../i18n/translations";
import { formatCurrency, exportToCSV } from "../engine/currency-formatter";

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  debts: CustomerDebt[];
  cashflow: CashflowRecord[];
  settings: StoreSettings;
  lastTransaction: Transaction | null;
  activeCategory: string;
  searchQuery: string;
  isOnline: boolean;
  language: SupportedLanguage;
  currency: SupportedCurrency;
  t: (keyPath: string) => string;

  // Invoice Append / Merge State
  appendingToInvoice: string | null;
  startAppendingToInvoice: (invoiceNumber: string) => void;
  cancelAppendingToInvoice: () => void;
  appendItemsToTransaction: (
    targetInvoiceNumber: string,
    paymentMethod: PaymentMethod,
    additionalAmountPaid: number,
    notes?: string
  ) => { success: boolean; transaction?: Transaction; message?: string };

  // Cart calculations
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalProfitEstimate: number;

  // Actions
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setCurrency: (curr: SupportedCurrency) => void;
  addToCart: (product: Product, quantity?: number) => void;
  addManualItemToCart: (name: string, price: number, quantity?: number) => void;
  updateCartItemQty: (lineId: string, quantityOrDelta: number, isDelta?: boolean) => void;
  setCartItemDiscount: (lineId: string, discountAmount: number) => void;
  removeCartItem: (lineId: string) => void;
  clearCart: () => void;
  scanBarcode: (rawBarcode: string, quantity?: number) => { success: boolean; product?: Product; message: string };
  processCheckout: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerName?: string,
    customerPhone?: string,
    notes?: string
  ) => { success: boolean; transaction?: Transaction; message?: string };
  addProduct: (product: Omit<Product, "id">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordDebtPayment: (debtId: string, amount: number, notes?: string) => void;
  addCashflow: (type: "KAS_MASUK" | "KAS_KELUAR", category: string, amount: number, notes?: string) => void;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => void;
  setLastTransaction: (tx: Transaction | null) => void;
  resetToSampleData: () => void;
  exportBackupJSON: () => void;
  exportProductsCSV: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "warungpro_products_v4",
  TRANSACTIONS: "warungpro_transactions_v4",
  DEBTS: "warungpro_debts_v4",
  CASHFLOW: "warungpro_cashflow_v4",
  SETTINGS: "warungpro_settings_v4",
  CART: "warungpro_cart_v4",
};

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_UMKM_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [cashflow, setCashflow] = useState<CashflowRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [appendingToInvoice, setAppendingToInvoice] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedProducts =
        localStorage.getItem(STORAGE_KEYS.PRODUCTS) ||
        localStorage.getItem("warungpro_products_v3") ||
        localStorage.getItem("warungpro_products_v2");

      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        // Refresh with accurate verified image URLs from INITIAL_UMKM_PRODUCTS
        const updated = parsed.map((p) => {
          const matched = INITIAL_UMKM_PRODUCTS.find((init) => init.id === p.id || init.sku === p.sku);
          if (matched && matched.imageUrl) {
            return { ...p, imageUrl: matched.imageUrl };
          }
          return p;
        });
        setProducts(updated);
      } else {
        setProducts(INITIAL_UMKM_PRODUCTS);
      }

      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || localStorage.getItem("warungpro_transactions_v2");
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

      const savedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS) || localStorage.getItem("warungpro_debts_v2");
      if (savedDebts) setDebts(JSON.parse(savedDebts));

      const savedCashflow = localStorage.getItem(STORAGE_KEYS.CASHFLOW) || localStorage.getItem("warungpro_cashflow_v2");
      if (savedCashflow) setCashflow(JSON.parse(savedCashflow));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem("warungpro_settings_v2");
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART) || localStorage.getItem("warungpro_cart_v2");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {}

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }
  }, [cart]);

  // Translation Helper
  const language = settings.language || "id";
  const currency = settings.currency || "IDR";

  const t = useCallback(
    (keyPath: string): string => {
      const keys = keyPath.split(".");
      let current: any = TRANSLATIONS[language] || TRANSLATIONS.en;
      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          // Fallback to english
          let fallback: any = TRANSLATIONS.en;
          for (const fb of keys) {
            if (fallback && typeof fallback === "object" && fb in fallback) {
              fallback = fallback[fb];
            } else {
              return keyPath;
            }
          }
          return typeof fallback === "string" ? fallback : keyPath;
        }
      }
      return typeof current === "string" ? current : keyPath;
    },
    [language]
  );

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountTotal = cart.reduce((acc, item) => acc + item.discountAmount, 0);
  const taxableBase = Math.max(0, subtotal - discountTotal);
  const taxTotal = settings.taxEnabled
    ? Math.round((taxableBase * settings.taxRate) / 100)
    : 0;
  const grandTotal = taxableBase + taxTotal;

  const totalProfitEstimate = cart.reduce((acc, item) => {
    const cost = item.product.costPrice || item.unitPrice * 0.75;
    const profitPerUnit = item.unitPrice - cost;
    return acc + profitPerUnit * item.quantity - item.discountAmount;
  }, 0);

  // Append Invoice Mode Handlers
  const startAppendingToInvoice = useCallback((invoiceNumber: string) => {
    setAppendingToInvoice(invoiceNumber);
    setCart([]);
    if (settings.enableSound) posAudio.playScanBeep();
  }, [settings.enableSound]);

  const cancelAppendingToInvoice = useCallback(() => {
    setAppendingToInvoice(null);
    if (settings.enableSound) posAudio.playErrorBuzz();
  }, [settings.enableSound]);

  // Add Item To Cart
  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (quantity <= 0) return;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.product.id === product.id);

        if (existingIndex >= 0) {
          const updated = [...prev];
          const existingItem = updated[existingIndex];
          const newQty = existingItem.quantity + quantity;
          const newSubtotal = existingItem.unitPrice * newQty - existingItem.discountAmount;

          updated[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            subtotal: newSubtotal,
          };
          return updated;
        } else {
          const newItem: CartItem = {
            id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            product,
            quantity,
            unitPrice: product.price,
            discountAmount: 0,
            subtotal: product.price * quantity,
          };
          return [...prev, newItem];
        }
      });

      if (settings.enableSound) posAudio.playScanBeep();
    },
    [settings.enableSound]
  );

  // Add Manual Custom Item (unlisted)
  const addManualItemToCart = useCallback(
    (name: string, price: number, quantity = 1) => {
      if (price <= 0 || quantity <= 0) return;

      const customProduct: Product = {
        id: `custom_${Date.now()}`,
        sku: `MANUAL-${Date.now().toString().slice(-6)}`,
        name: name.trim() || "Item Bebas",
        category: "lainnya",
        price,
        costPrice: Math.round(price * 0.75),
        stock: 999,
        minStockAlert: 0,
        unit: "item",
        imageUrl: "/products/prod_sembako_006.svg",
      };

      addToCart(customProduct, quantity);
    },
    [addToCart]
  );

  // Update Cart Quantity
  const updateCartItemQty = useCallback(
    (lineId: string, quantityOrDelta: number, isDelta = false) => {
      setCart((prev) => {
        return prev
          .map((item) => {
            if (item.id === lineId) {
              const newQty = isDelta ? item.quantity + quantityOrDelta : quantityOrDelta;
              if (newQty <= 0) return null;

              const newSubtotal = item.unitPrice * newQty - item.discountAmount;
              return {
                ...item,
                quantity: newQty,
                subtotal: Math.max(0, newSubtotal),
              };
            }
            return item;
          })
          .filter(Boolean) as CartItem[];
      });

      if (settings.enableSound) posAudio.playScanBeep();
    },
    [settings.enableSound]
  );

  // Set line discount
  const setCartItemDiscount = useCallback((lineId: string, discountAmount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === lineId) {
          const safeDiscount = Math.max(0, Math.min(discountAmount, item.unitPrice * item.quantity));
          const newSubtotal = item.unitPrice * item.quantity - safeDiscount;
          return {
            ...item,
            discountAmount: safeDiscount,
            subtotal: newSubtotal,
          };
        }
        return item;
      })
    );
  }, []);

  // Remove Item
  const removeCartItem = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== lineId));
  }, []);

  // Clear Cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Barcode Scanner handler
  const scanBarcode = useCallback(
    (rawBarcode: string, quantity = 1) => {
      const cleanBarcode = rawBarcode.trim();
      if (!cleanBarcode) return { success: false, message: "Barcode kosong." };

      const matchedProduct = products.find(
        (p) =>
          p.sku.toLowerCase() === cleanBarcode.toLowerCase() ||
          p.name.toLowerCase().includes(cleanBarcode.toLowerCase())
      );

      if (matchedProduct) {
        addToCart(matchedProduct, quantity);
        return {
          success: true,
          product: matchedProduct,
          message: `Berhasil menambahkan: ${matchedProduct.name}`,
        };
      } else {
        if (settings.enableSound) posAudio.playErrorBuzz();
        return {
          success: false,
          message: `Barang dengan kode/nama "${cleanBarcode}" tidak ditemukan.`,
        };
      }
    },
    [products, addToCart, settings.enableSound]
  );

  // Process checkout & payment
  const processCheckout = useCallback(
    (
      paymentMethod: PaymentMethod,
      amountPaid: number,
      customerName?: string,
      customerPhone?: string,
      notes?: string
    ) => {
      if (cart.length === 0) {
        return { success: false, message: "Cart is empty." };
      }

      if (paymentMethod !== "KASBON" && amountPaid < grandTotal) {
        return {
          success: false,
          message: `Amount tendered is short by ${formatCurrency(grandTotal - amountPaid, currency)}`,
        };
      }

      const changeDue = paymentMethod === "KASBON" ? 0 : Math.max(0, amountPaid - grandTotal);
      const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        invoiceNumber,
        timestamp: new Date().toISOString(),
        items: [...cart],
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        paymentMethod,
        amountPaid: paymentMethod === "KASBON" ? 0 : amountPaid,
        changeDue,
        profit: totalProfitEstimate,
        currency,
        customerName: customerName?.trim() || undefined,
        customerPhone: customerPhone?.trim() || undefined,
        cashierName: "Store Cashier",
        notes,
      };

      // 1. If KASBON, record to CustomerDebt ledger
      if (paymentMethod === "KASBON" && customerName) {
        const cleanName = customerName.trim();
        const cleanPhone = customerPhone?.trim() || "-";

        setDebts((prev) => {
          const existingIdx = prev.findIndex(
            (d) => d.customerName.toLowerCase() === cleanName.toLowerCase()
          );

          let updatedDebts: CustomerDebt[];
          if (existingIdx >= 0) {
            updatedDebts = [...prev];
            const existing = updatedDebts[existingIdx];
            updatedDebts[existingIdx] = {
              ...existing,
              totalDebt: existing.totalDebt + grandTotal,
              remainingDebt: existing.remainingDebt + grandTotal,
              customerPhone: cleanPhone !== "-" ? cleanPhone : existing.customerPhone,
              relatedInvoices: [invoiceNumber, ...existing.relatedInvoices],
            };
          } else {
            const newDebt: CustomerDebt = {
              id: `debt_${Date.now()}`,
              customerName: cleanName,
              customerPhone: cleanPhone,
              totalDebt: grandTotal,
              remainingDebt: grandTotal,
              currency,
              createdAt: new Date().toISOString(),
              payments: [],
              relatedInvoices: [invoiceNumber],
            };
            updatedDebts = [newDebt, ...prev];
          }

          localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(updatedDebts));
          return updatedDebts;
        });
      }

      // 2. Deduct product inventory stocks
      setProducts((prev) => {
        const updated = prev.map((prod) => {
          const line = cart.find((it) => it.product.id === prod.id);
          if (line) {
            return { ...prod, stock: Math.max(0, prod.stock - line.quantity) };
          }
          return prod;
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });

      // 3. Save Transaction
      const updatedTx = [newTransaction, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTx));

      // 4. Feedback & Clear Cart
      if (settings.enableSound) posAudio.playSuccessChime();
      setLastTransaction(newTransaction);
      setCart([]);
      setAppendingToInvoice(null);

      return {
        success: true,
        transaction: newTransaction,
        message: "Sale transaction completed successfully!",
      };
    },
    [cart, grandTotal, subtotal, discountTotal, taxTotal, totalProfitEstimate, transactions, currency, settings.enableSound]
  );

  // Append / Merge additional items to an existing invoice
  const appendItemsToTransaction = useCallback(
    (
      targetInvoiceNumber: string,
      paymentMethod: PaymentMethod,
      additionalAmountPaid: number,
      notes?: string
    ) => {
      if (cart.length === 0) {
        return { success: false, message: "No additional items in cart to append." };
      }

      const existingTx = transactions.find((t) => t.invoiceNumber === targetInvoiceNumber);
      if (!existingTx) {
        return { success: false, message: `Invoice ${targetInvoiceNumber} not found.` };
      }

      if (paymentMethod !== "KASBON" && additionalAmountPaid < grandTotal) {
        return {
          success: false,
          message: `Amount tendered for additional items is short by ${formatCurrency(grandTotal - additionalAmountPaid, currency)}`,
        };
      }

      // Merge items: combine quantities for existing items or append new lines
      const mergedItems: CartItem[] = [...existingTx.items];
      cart.forEach((newItem) => {
        const existingItemIndex = mergedItems.findIndex(
          (it) => it.product.id === newItem.product.id && it.unitPrice === newItem.unitPrice
        );
        if (existingItemIndex >= 0) {
          const prev = mergedItems[existingItemIndex];
          const newQty = prev.quantity + newItem.quantity;
          const newDiscount = prev.discountAmount + newItem.discountAmount;
          const newSub = prev.unitPrice * newQty - newDiscount;
          mergedItems[existingItemIndex] = {
            ...prev,
            quantity: newQty,
            discountAmount: newDiscount,
            subtotal: newSub,
          };
        } else {
          mergedItems.push({
            ...newItem,
            id: `line_app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          });
        }
      });

      // Recalculate financial totals
      const newSubtotal = mergedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
      const newDiscountTotal = mergedItems.reduce((sum, it) => sum + it.discountAmount, 0);
      const taxBase = Math.max(0, newSubtotal - newDiscountTotal);
      const newTaxTotal = settings.taxEnabled
        ? Math.round((taxBase * settings.taxRate) / 100)
        : 0;
      const newGrandTotal = taxBase + newTaxTotal;

      const newProfit = mergedItems.reduce((sum, it) => {
        const hpp = it.product.costPrice || it.unitPrice * 0.75;
        return sum + (it.unitPrice - hpp) * it.quantity - it.discountAmount;
      }, 0);

      const totalPaid = existingTx.amountPaid + (paymentMethod === "KASBON" ? 0 : additionalAmountPaid);
      const newChangeDue = paymentMethod === "KASBON" ? 0 : Math.max(0, totalPaid - newGrandTotal);

      const updatedTransaction: Transaction = {
        ...existingTx,
        timestamp: new Date().toISOString(),
        items: mergedItems,
        subtotal: newSubtotal,
        discountTotal: newDiscountTotal,
        taxTotal: newTaxTotal,
        grandTotal: newGrandTotal,
        amountPaid: totalPaid,
        changeDue: newChangeDue,
        profit: newProfit,
        notes: notes ? `${existingTx.notes ? existingTx.notes + " | " : ""}${notes}` : existingTx.notes,
      };

      // 1. Deduct stock for the newly added cart items
      setProducts((prev) => {
        const updated = prev.map((prod) => {
          const line = cart.find((it) => it.product.id === prod.id);
          if (line) {
            return { ...prod, stock: Math.max(0, prod.stock - line.quantity) };
          }
          return prod;
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });

      // 2. If KASBON, update customer debt
      if ((existingTx.paymentMethod === "KASBON" || paymentMethod === "KASBON") && existingTx.customerName) {
        setDebts((prev) => {
          const updated = prev.map((d) => {
            if (d.customerName.toLowerCase() === existingTx.customerName?.toLowerCase()) {
              const diff = newGrandTotal - existingTx.grandTotal;
              return {
                ...d,
                totalDebt: d.totalDebt + diff,
                remainingDebt: d.remainingDebt + diff,
              };
            }
            return d;
          });
          localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(updated));
          return updated;
        });
      }

      // 3. Save updated transactions
      const updatedTxList = transactions.map((t) =>
        t.invoiceNumber === targetInvoiceNumber ? updatedTransaction : t
      );
      setTransactions(updatedTxList);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTxList));

      // 4. Feedback & Reset
      if (settings.enableSound) posAudio.playSuccessChime();
      setLastTransaction(updatedTransaction);
      setCart([]);
      setAppendingToInvoice(null);

      return {
        success: true,
        transaction: updatedTransaction,
        message: `Invoice ${targetInvoiceNumber} updated and merged with additional items!`,
      };
    },
    [cart, grandTotal, transactions, currency, settings, settings.taxEnabled, settings.taxRate]
  );

  // Add master product
  const addProduct = useCallback((productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });

    if (settings.enableSound) posAudio.playSuccessChime();
    return newProduct;
  }, [settings.enableSound]);

  // Update product
  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Delete product
  const deleteProduct = useCallback((id: string) => {
    if (settings.enableSound) posAudio.playErrorBuzz();
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
  }, [settings.enableSound]);

  // Record Kasbon repayment
  const recordDebtPayment = useCallback((debtId: string, amount: number, notes?: string) => {
    setDebts((prev) => {
      const updated = prev.map((d) => {
        if (d.id === debtId) {
          const cleanAmount = Math.min(d.remainingDebt, Math.max(0, amount));
          const newPayment = {
            id: `pay_${Date.now()}`,
            date: new Date().toISOString(),
            amount: cleanAmount,
            notes,
          };
          return {
            ...d,
            remainingDebt: Math.max(0, d.remainingDebt - cleanAmount),
            payments: [newPayment, ...d.payments],
          };
        }
        return d;
      });

      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(updated));
      return updated;
    });

    if (settings.enableSound) posAudio.playSuccessChime();
  }, [settings.enableSound]);

  // Add Cashflow
  const addCashflow = useCallback(
    (type: "KAS_MASUK" | "KAS_KELUAR", category: string, amount: number, notes?: string) => {
      const newRecord: CashflowRecord = {
        id: `cf_${Date.now()}`,
        type,
        category,
        amount: Math.max(0, amount),
        currency,
        timestamp: new Date().toISOString(),
        notes: notes || "",
        operator: "Kasir Toko",
      };

      setCashflow((prev) => {
        const updated = [newRecord, ...prev];
        localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(updated));
        return updated;
      });

      if (settings.enableSound) posAudio.playSuccessChime();
    },
    [currency, settings.enableSound]
  );

  // Update Store Settings
  const updateStoreSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setLanguage = useCallback(
    (lang: SupportedLanguage) => {
      updateStoreSettings({ language: lang });
    },
    [updateStoreSettings]
  );

  const setCurrency = useCallback(
    (curr: SupportedCurrency) => {
      updateStoreSettings({ currency: curr });
    },
    [updateStoreSettings]
  );

  // Export JSON Backup
  const exportBackupJSON = useCallback(() => {
    const backupData = {
      version: "2.0.0",
      exportDate: new Date().toISOString(),
      storeSettings: settings,
      products,
      transactions,
      debts,
      cashflow,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WarungPro_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [settings, products, transactions, debts, cashflow]);

  // Export Products to CSV / Excel
  const exportProductsCSV = useCallback(() => {
    const rows = products.map((p) => ({
      ID: p.id,
      Barcode_SKU: p.sku,
      Product_Name: p.name,
      Category: p.category,
      Unit_Price: p.price,
      Cost_Price: p.costPrice,
      Profit_Margin: p.price - p.costPrice,
      Stock_Qty: p.stock,
      Unit: p.unit,
      Currency: currency,
    }));
    exportToCSV(`WarungPro_Catalog_${new Date().toISOString().slice(0, 10)}`, rows);
  }, [products, currency]);

  // Reset to initial catalog
  const resetToSampleData = useCallback(() => {
    setProducts(INITIAL_UMKM_PRODUCTS);
    setCart([]);
    setTransactions([]);
    setDebts([]);
    setCashflow([]);
    setSettings(DEFAULT_STORE_SETTINGS);
    setAppendingToInvoice(null);

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_UMKM_PRODUCTS));
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.CASHFLOW);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));

    if (settings.enableSound) posAudio.playSuccessChime();
  }, [settings.enableSound]);

  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        transactions,
        debts,
        cashflow,
        settings,
        lastTransaction,
        activeCategory,
        searchQuery,
        isOnline,
        language,
        currency,
        t,
        appendingToInvoice,
        startAppendingToInvoice,
        cancelAppendingToInvoice,
        appendItemsToTransaction,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        totalProfitEstimate,
        setActiveCategory,
        setSearchQuery,
        setLanguage,
        setCurrency,
        addToCart,
        addManualItemToCart,
        updateCartItemQty,
        setCartItemDiscount,
        removeCartItem,
        clearCart,
        scanBarcode,
        processCheckout,
        addProduct,
        updateProduct,
        deleteProduct,
        recordDebtPayment,
        addCashflow,
        updateStoreSettings,
        setLastTransaction,
        resetToSampleData,
        exportBackupJSON,
        exportProductsCSV,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
}
