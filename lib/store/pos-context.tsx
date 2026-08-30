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
  PRODUCTS: "warungpro_products_v3",
  TRANSACTIONS: "warungpro_transactions_v3",
  DEBTS: "warungpro_debts_v3",
  CASHFLOW: "warungpro_cashflow_v3",
  SETTINGS: "warungpro_settings_v3",
  CART: "warungpro_cart_v3",
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

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem("warungpro_products_v2");
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
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      const keys = keyPath.split(".");
      let current: any = dict;
      for (const k of keys) {
        if (current && current[k] !== undefined) {
          current = current[k];
        } else {
          return keyPath;
        }
      }
      return typeof current === "string" ? current : keyPath;
    },
    [language]
  );

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setSettings((prev) => {
      const updated = { ...prev, language: lang };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setCurrency = useCallback((curr: SupportedCurrency) => {
    setSettings((prev) => {
      const updated = { ...prev, currency: curr };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Cart Totals with Tax Engine
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxableBase = Math.max(0, subtotal - discountTotal);
  const taxTotal = settings.taxEnabled ? Math.round((taxableBase * settings.taxRate) / 100) : 0;
  const grandTotal = taxableBase + taxTotal;
  const totalProfitEstimate = cart.reduce((sum, item) => {
    const profitPerUnit = item.unitPrice - item.product.costPrice;
    return sum + profitPerUnit * item.quantity - item.discountAmount;
  }, 0);

  // Add product to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (settings.enableSound) posAudio.playScanBeep();
    setCart((prev) => {
      const existingIdx = prev.findIndex((it) => it.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.quantity + quantity;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          subtotal: item.unitPrice * newQty - item.discountAmount,
        };
        return updated;
      } else {
        const newLine: CartItem = {
          id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          product,
          quantity,
          unitPrice: product.price,
          discountAmount: 0,
          subtotal: product.price * quantity,
        };
        return [newLine, ...prev];
      }
    });
  }, [settings.enableSound]);

  // Add custom manual item
  const addManualItemToCart = useCallback((name: string, price: number, quantity: number = 1) => {
    if (settings.enableSound) posAudio.playScanBeep();
    const virtualProduct: Product = {
      id: `manual_${Date.now()}`,
      sku: `MANUAL-${Date.now().toString().slice(-4)}`,
      name: name.trim() || "Custom Item",
      category: "lainnya",
      price: Math.max(0, price),
      costPrice: Math.round(price * 0.7),
      stock: 999,
      minStockAlert: 0,
      unit: "pcs",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
    };

    const newLine: CartItem = {
      id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      product: virtualProduct,
      quantity,
      unitPrice: virtualProduct.price,
      discountAmount: 0,
      subtotal: virtualProduct.price * quantity,
    };

    setCart((prev) => [newLine, ...prev]);
  }, [settings.enableSound]);

  // Update item quantity
  const updateCartItemQty = useCallback((lineId: string, quantityOrDelta: number, isDelta: boolean = false) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === lineId) {
            const newQty = isDelta ? item.quantity + quantityOrDelta : quantityOrDelta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty - item.discountAmount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  // Set line discount
  const setCartItemDiscount = useCallback((lineId: string, discountAmount: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === lineId) {
          const discount = Math.max(0, Math.min(item.unitPrice * item.quantity, discountAmount));
          return {
            ...item,
            discountAmount: discount,
            subtotal: item.unitPrice * item.quantity - discount,
          };
        }
        return item;
      });
    });
  }, []);

  // Remove cart item
  const removeCartItem = useCallback((lineId: string) => {
    if (settings.enableSound) posAudio.playErrorBuzz();
    setCart((prev) => prev.filter((it) => it.id !== lineId));
  }, [settings.enableSound]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Scan barcode lookup
  const scanBarcode = useCallback(
    (rawBarcode: string, quantity: number = 1) => {
      const query = rawBarcode.trim();
      if (!query) {
        return { success: false, message: "Barcode is empty." };
      }

      const found = products.find(
        (p) =>
          p.sku === query ||
          p.id === query ||
          p.name.toLowerCase() === query.toLowerCase()
      );

      if (found) {
        addToCart(found, quantity);
        return {
          success: true,
          product: found,
          message: `${found.name} (${quantity}x) added to cart.`,
        };
      } else {
        if (settings.enableSound) posAudio.playErrorBuzz();
        return {
          success: false,
          message: `Barcode '${query}' is not registered in catalog.`,
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

      return {
        success: true,
        transaction: newTransaction,
        message: "Sale transaction completed successfully!",
      };
    },
    [cart, grandTotal, subtotal, discountTotal, taxTotal, totalProfitEstimate, transactions, currency, settings.enableSound]
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
    (type: "KAS_MASUK" | "KAS_KELUAR", category: string, amount: number, notes: string = "") => {
      const newRecord: CashflowRecord = {
        id: `cf_${Date.now()}`,
        type,
        category,
        amount: Math.max(0, amount),
        currency,
        timestamp: new Date().toISOString(),
        notes,
        operator: "Store Cashier",
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

  // Update Settings
  const updateStoreSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Export JSON Backup
  const exportBackupJSON = useCallback(() => {
    const backup = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      store: settings,
      products,
      transactions,
      debts,
      cashflow,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WarungPro_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [settings, products, transactions, debts, cashflow]);

  // Export Products CSV
  const exportProductsCSV = useCallback(() => {
    const rows = products.map((p) => ({
      ID: p.id,
      SKU_Barcode: p.sku,
      Name: p.name,
      Category: p.category,
      Selling_Price: p.price,
      Cost_Price: p.costPrice,
      Stock: p.stock,
      Unit: p.unit,
    }));
    exportToCSV(`WarungPro_Catalog_${new Date().toISOString().slice(0, 10)}`, rows);
  }, [products]);

  // Reset to default sample
  const resetToSampleData = useCallback(() => {
    setProducts(INITIAL_UMKM_PRODUCTS);
    setCart([]);
    setTransactions([]);
    setDebts([]);
    setCashflow([]);
    setSettings(DEFAULT_STORE_SETTINGS);
    localStorage.clear();
    if (settings.enableSound) posAudio.playScanBeep();
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
