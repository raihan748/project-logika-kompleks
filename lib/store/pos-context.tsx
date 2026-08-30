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

  // Cart calculations
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  totalProfitEstimate: number;

  // Actions
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
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
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "warungpro_products_v1",
  TRANSACTIONS: "warungpro_transactions_v1",
  DEBTS: "warungpro_debts_v1",
  CASHFLOW: "warungpro_cashflow_v1",
  SETTINGS: "warungpro_settings_v1",
  CART: "warungpro_cart_v1",
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
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

      const savedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
      if (savedDebts) setDebts(JSON.parse(savedDebts));

      const savedCashflow = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
      if (savedCashflow) setCashflow(JSON.parse(savedCashflow));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
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

  // Cart Totals
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);
  const totalProfitEstimate = cart.reduce((sum, item) => {
    const profitPerUnit = item.unitPrice - item.product.costPrice;
    return sum + profitPerUnit * item.quantity - item.discountAmount;
  }, 0);

  // Add product to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    posAudio.playScanBeep();
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
  }, []);

  // Add custom manual item (item bebas tanpa barcode)
  const addManualItemToCart = useCallback((name: string, price: number, quantity: number = 1) => {
    posAudio.playScanBeep();
    const virtualProduct: Product = {
      id: `manual_${Date.now()}`,
      sku: `MANUAL-${Date.now().toString().slice(-4)}`,
      name: name.trim() || "Item Manual",
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
  }, []);

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
    posAudio.playErrorBuzz();
    setCart((prev) => prev.filter((it) => it.id !== lineId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Scan barcode lookup
  const scanBarcode = useCallback(
    (rawBarcode: string, quantity: number = 1) => {
      const query = rawBarcode.trim();
      if (!query) {
        return { success: false, message: "Barcode tidak boleh kosong." };
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
          message: `${found.name} (${quantity}x) berhasil dimasukkan ke keranjang.`,
        };
      } else {
        posAudio.playErrorBuzz();
        return {
          success: false,
          message: `Barcode '${query}' belum terdaftar di katalog toko.`,
        };
      }
    },
    [products, addToCart]
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
        return { success: false, message: "Keranjang belanja masih kosong." };
      }

      if (paymentMethod !== "KASBON" && amountPaid < grandTotal) {
        return {
          success: false,
          message: `Uang yang diterima kurang Rp ${(grandTotal - amountPaid).toLocaleString("id-ID")}`,
        };
      }

      const changeDue = paymentMethod === "KASBON" ? 0 : Math.max(0, amountPaid - grandTotal);
      const invoiceNumber = `NOTA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        invoiceNumber,
        timestamp: new Date().toISOString(),
        items: [...cart],
        subtotal,
        discountTotal,
        grandTotal,
        paymentMethod,
        amountPaid: paymentMethod === "KASBON" ? 0 : amountPaid,
        changeDue,
        profit: totalProfitEstimate,
        customerName: customerName?.trim() || undefined,
        customerPhone: customerPhone?.trim() || undefined,
        cashierName: "Kasir Toko",
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
      posAudio.playSuccessChime();
      setLastTransaction(newTransaction);
      setCart([]);

      return {
        success: true,
        transaction: newTransaction,
        message: "Transaksi berhasil diselesaikan!",
      };
    },
    [cart, grandTotal, subtotal, discountTotal, totalProfitEstimate, transactions]
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

    posAudio.playSuccessChime();
    return newProduct;
  }, []);

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
    posAudio.playErrorBuzz();
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

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

    posAudio.playSuccessChime();
  }, []);

  // Add Cashflow (Kas Masuk / Kas Keluar)
  const addCashflow = useCallback(
    (type: "KAS_MASUK" | "KAS_KELUAR", category: string, amount: number, notes: string = "") => {
      const newRecord: CashflowRecord = {
        id: `cf_${Date.now()}`,
        type,
        category,
        amount: Math.max(0, amount),
        timestamp: new Date().toISOString(),
        notes,
        operator: "Kasir Utama",
      };

      setCashflow((prev) => {
        const updated = [newRecord, ...prev];
        localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(updated));
        return updated;
      });

      posAudio.playSuccessChime();
    },
    []
  );

  // Update Settings
  const updateStoreSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Reset to default sample
  const resetToSampleData = useCallback(() => {
    setProducts(INITIAL_UMKM_PRODUCTS);
    setCart([]);
    setTransactions([]);
    setDebts([]);
    setCashflow([]);
    setSettings(DEFAULT_STORE_SETTINGS);
    localStorage.clear();
    posAudio.playScanBeep();
  }, []);

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
        subtotal,
        discountTotal,
        grandTotal,
        totalProfitEstimate,
        setActiveCategory,
        setSearchQuery,
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
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOS harus digunakan di dalam POSProvider");
  }
  return context;
}
