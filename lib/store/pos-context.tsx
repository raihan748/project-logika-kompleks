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
  CustomerMember,
  MemberTier,
  MembershipType,
} from "../types/pos";
import { INITIAL_UMKM_PRODUCTS, DEFAULT_STORE_SETTINGS } from "../data/umkm-catalog";
import { INITIAL_SAMPLE_MEMBERS } from "../data/sample-members";
import { posAudio } from "../engine/sound-effects";
import { SupportedCurrency, SupportedLanguage, TRANSLATIONS, CURRENCY_CONFIGS } from "../i18n/translations";
import { formatCurrency, exportToCSV } from "../engine/currency-formatter";
import { supabase } from "../supabase/client";

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
  isSupabaseConnected: boolean;
  syncStatus: "synced" | "syncing" | "offline" | "error";
  language: SupportedLanguage;
  currency: SupportedCurrency;
  t: (keyPath: string) => string;

  // Membership State
  members: CustomerMember[];
  activeMember: CustomerMember | null;
  pointsToRedeem: number;
  memberDiscountAmount: number;
  pointsDiscountAmount: number;
  potentialPointsEarned: number;

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
  syncWithSupabaseCloud: () => Promise<{ success: boolean; message: string }>;

  // Membership Actions
  setActiveMember: (member: CustomerMember | null) => void;
  setPointsToRedeem: (points: number) => void;
  identifyMemberByBarcodeOrPhone: (input: string) => { found: boolean; member?: CustomerMember; message: string };
  quickRegisterMember: (phone: string, name: string, tier?: MemberTier, type?: MembershipType) => CustomerMember;
  addMember: (memberData: Omit<CustomerMember, "id">) => CustomerMember;
  updateMember: (id: string, updates: Partial<CustomerMember>) => void;
  deleteMember: (id: string) => void;
  adjustMemberPoints: (id: string, deltaPoints: number, reason?: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "warungpro_products_v5",
  TRANSACTIONS: "warungpro_transactions_v4",
  DEBTS: "warungpro_debts_v4",
  CASHFLOW: "warungpro_cashflow_v4",
  SETTINGS: "warungpro_settings_v4",
  CART: "warungpro_cart_v4",
  MEMBERS: "warungpro_members_v4",
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
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline" | "error">("synced");
  const [appendingToInvoice, setAppendingToInvoice] = useState<string | null>(null);

  // Membership State
  const [members, setMembers] = useState<CustomerMember[]>(INITIAL_SAMPLE_MEMBERS);
  const [activeMember, setActiveMember] = useState<CustomerMember | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Load from LocalStorage & Check Supabase Connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedProducts =
        localStorage.getItem(STORAGE_KEYS.PRODUCTS) ||
        localStorage.getItem("warungpro_products_v4") ||
        localStorage.getItem("warungpro_products_v3") ||
        localStorage.getItem("warungpro_products_v2");

      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        const updated = parsed.map((p) => {
          const matched = INITIAL_UMKM_PRODUCTS.find((init) => init.id === p.id || init.sku === p.sku);
          if (matched && matched.imageUrl) {
            return { ...p, imageUrl: matched.imageUrl };
          }
          return p;
        });
        setProducts(updated);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      } else {
        setProducts(INITIAL_UMKM_PRODUCTS);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_UMKM_PRODUCTS));
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
      if (savedCart) {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        const updatedCart = parsedCart.map((item) => {
          const matched = INITIAL_UMKM_PRODUCTS.find((init) => init.id === item.product.id || init.sku === item.product.sku);
          if (matched && matched.imageUrl) {
            return { ...item, product: { ...item.product, imageUrl: matched.imageUrl } };
          }
          return item;
        });
        setCart(updatedCart);
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));
      }

      const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        setMembers(INITIAL_SAMPLE_MEMBERS);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_SAMPLE_MEMBERS));
      }
    } catch {}

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("synced");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial Supabase Ping & Keepalive Pulse
    const pingSupabase = async () => {
      try {
        const res = await fetch("/api/keepalive?source=client-init");
        if (res.ok) {
          setIsSupabaseConnected(true);
          setSyncStatus("synced");
        }
      } catch {
        setIsSupabaseConnected(false);
      }
    };
    pingSupabase();

    // Client-side periodic keepalive heartbeat (every 10 minutes)
    const keepaliveInterval = setInterval(() => {
      if (navigator.onLine) {
        fetch("/api/keepalive?source=client-heartbeat").catch(() => {});
      }
    }, 10 * 60 * 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(keepaliveInterval);
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

  // Membership & Discount Calculations
  const getMemberDiscountPercent = (member: CustomerMember): number => {
    if (member.membershipType !== "POTONGAN" && member.membershipType !== "HYBRID") {
      return 0;
    }
    let tierPercent = 0;
    if (member.tier === "PLATINUM") tierPercent = settings.tierPlatinumDiscount ?? 15;
    else if (member.tier === "GOLD") tierPercent = settings.tierGoldDiscount ?? 10;
    else if (member.tier === "SILVER") tierPercent = settings.tierSilverDiscount ?? 5;
    return Math.max(tierPercent, member.discountPercent || 0);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const lineDiscountTotal = cart.reduce((acc, item) => acc + item.discountAmount, 0);
  const netAfterLineDiscounts = Math.max(0, subtotal - lineDiscountTotal);

  const memberDiscountPercent = activeMember ? getMemberDiscountPercent(activeMember) : 0;
  const memberDiscountAmount = activeMember
    ? Math.round((netAfterLineDiscounts * memberDiscountPercent) / 100)
    : 0;

  const afterMemberDiscount = Math.max(0, netAfterLineDiscounts - memberDiscountAmount);

  // Points redemption value
  const redeemUnitValue = settings.memberPointRedeemValue || 100; // e.g. Rp 100 per point
  const canUsePoints = activeMember && (activeMember.membershipType === "POINT" || activeMember.membershipType === "HYBRID");
  const maxRedeemablePoints = canUsePoints ? Math.min(activeMember.points, Math.floor(afterMemberDiscount / redeemUnitValue)) : 0;
  const clampedPointsToRedeem = Math.max(0, Math.min(pointsToRedeem, maxRedeemablePoints));
  const pointsDiscountAmount = clampedPointsToRedeem * redeemUnitValue;

  const discountTotal = lineDiscountTotal + memberDiscountAmount + pointsDiscountAmount;
  const taxableBase = Math.max(0, subtotal - discountTotal);
  const taxTotal = settings.taxEnabled
    ? Math.round((taxableBase * settings.taxRate) / 100)
    : 0;
  const grandTotal = taxableBase + taxTotal;

  // Potential earned points from this transaction
  const earnRate = settings.memberPointsEarnRate || 1000;
  const potentialPointsEarned = activeMember && (activeMember.membershipType === "POINT" || activeMember.membershipType === "HYBRID")
    ? Math.floor(grandTotal / earnRate)
    : 0;

  const totalProfitEstimate = cart.reduce((acc, item) => {
    const cost = item.product.costPrice || item.unitPrice * 0.75;
    const profitPerUnit = item.unitPrice - cost;
    return acc + profitPerUnit * item.quantity - item.discountAmount;
  }, 0) - memberDiscountAmount - pointsDiscountAmount;

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
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80",
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

      const memberId = activeMember?.id;
      const memberCode = activeMember?.memberCode;
      const memberName = activeMember?.name;
      const memberTier = activeMember?.tier;
      const memberDiscountTotal = memberDiscountAmount;
      const pointsEarned = potentialPointsEarned;
      const pointsRedeemed = clampedPointsToRedeem;
      const pointsValueRedeemed = pointsDiscountAmount;

      const finalCustomerName = customerName?.trim() || activeMember?.name || undefined;
      const finalCustomerPhone = customerPhone?.trim() || activeMember?.phone || undefined;

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
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        cashierName: "Store Cashier",
        notes,
        memberId,
        memberCode,
        memberName,
        memberTier,
        memberDiscountTotal: memberDiscountTotal > 0 ? memberDiscountTotal : undefined,
        pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
        pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        pointsValueRedeemed: pointsValueRedeemed > 0 ? pointsValueRedeemed : undefined,
      };

      // 1. If KASBON, record to CustomerDebt ledger
      if (paymentMethod === "KASBON" && finalCustomerName) {
        const cleanName = finalCustomerName;
        const cleanPhone = finalCustomerPhone || "-";

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

        // Supabase async sync
        fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: cleanName,
            customerPhone: cleanPhone,
            totalDebt: grandTotal,
            currency,
            invoiceNumber,
          }),
        }).catch(() => {});
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

      // 3. Update member points and statistics if active member
      if (activeMember) {
        setMembers((prev) => {
          const updated = prev.map((m) => {
            if (m.id === activeMember.id) {
              const newPoints = Math.max(0, m.points - pointsRedeemed + pointsEarned);
              const newSpent = m.totalSpent + grandTotal;
              const newVisits = m.totalVisits + 1;
              return {
                ...m,
                points: newPoints,
                totalSpent: newSpent,
                totalVisits: newVisits,
              };
            }
            return m;
          });
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
          return updated;
        });

        // Supabase async sync for member
        fetch("/api/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeMember.id,
            pointsDelta: pointsEarned - pointsRedeemed,
            spentDelta: grandTotal,
            visitsDelta: 1,
          }),
        }).catch(() => {});
      }

      // 4. Save Transaction to local state & storage
      const updatedTx = [newTransaction, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTx));

      // 5. Background sync to Supabase
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
      }).catch(() => {});

      // 6. Feedback & Reset Active Member & Cart
      if (settings.enableSound) posAudio.playSuccessChime();
      setLastTransaction(newTransaction);
      setCart([]);
      setAppendingToInvoice(null);
      setActiveMember(null);
      setPointsToRedeem(0);

      return {
        success: true,
        transaction: newTransaction,
        message: "Sale transaction completed successfully!",
      };
    },
    [
      cart,
      grandTotal,
      subtotal,
      discountTotal,
      taxTotal,
      totalProfitEstimate,
      transactions,
      currency,
      activeMember,
      memberDiscountAmount,
      potentialPointsEarned,
      clampedPointsToRedeem,
      pointsDiscountAmount,
      settings.enableSound,
    ]
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

      // 4. Background sync to Supabase
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      }).catch(() => {});

      // 5. Feedback & Reset
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

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    }).catch(() => {});

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

    fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  }, []);

  // Delete product
  const deleteProduct = useCallback((id: string) => {
    if (settings.enableSound) posAudio.playErrorBuzz();
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });

    fetch(`/api/products?id=${id}`, {
      method: "DELETE",
    }).catch(() => {});
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

    fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtId, paymentAmount: amount, notes }),
    }).catch(() => {});

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

      fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      }).catch(() => {});

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

  // Membership Management Functions
  const identifyMemberByBarcodeOrPhone = useCallback(
    (input: string) => {
      const clean = input.trim();
      if (!clean) return { found: false, message: "Kode atau nomor telepon kosong." };

      const digitsOnly = clean.replace(/\D/g, "");

      const matched = members.find((m) => {
        if (m.memberCode.toLowerCase() === clean.toLowerCase()) return true;
        if (m.id.toLowerCase() === clean.toLowerCase()) return true;
        if (digitsOnly.length >= 8 && m.phone.replace(/\D/g, "") === digitsOnly) return true;
        if (m.name.toLowerCase() === clean.toLowerCase()) return true;
        return false;
      });

      if (matched) {
        setActiveMember(matched);
        setPointsToRedeem(0);
        if (settings.enableSound) posAudio.playSuccessChime();
        return {
          found: true,
          member: matched,
          message: `Member terdeteksi: ${matched.name} (${matched.tier} - ${matched.membershipType})`,
        };
      } else {
        if (settings.enableSound) posAudio.playErrorBuzz();
        return {
          found: false,
          message: `Member dengan kode/nomor "${clean}" tidak ditemukan.`,
        };
      }
    },
    [members, settings.enableSound]
  );

  const quickRegisterMember = useCallback(
    (phone: string, name: string, tier: MemberTier = "REGULAR", type: MembershipType = "POINT") => {
      const cleanPhone = phone.trim();
      const cleanName = name.trim();
      const autoCode = `MBR-${Math.floor(1000 + Math.random() * 9000)}`;

      const newMember: CustomerMember = {
        id: `mbr_${Date.now()}`,
        memberCode: autoCode,
        name: cleanName || `Member ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        tier,
        membershipType: type,
        points: 0,
        totalSpent: 0,
        totalVisits: 0,
        discountPercent:
          tier === "PLATINUM"
            ? (settings.tierPlatinumDiscount ?? 15)
            : tier === "GOLD"
            ? (settings.tierGoldDiscount ?? 10)
            : tier === "SILVER"
            ? (settings.tierSilverDiscount ?? 5)
            : 0,
        createdAt: new Date().toISOString(),
        notes: "Pendaftaran kilat di kasir",
      };

      setMembers((prev) => {
        const updated = [newMember, ...prev];
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
        return updated;
      });

      setActiveMember(newMember);
      setPointsToRedeem(0);

      fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      }).catch(() => {});

      if (settings.enableSound) posAudio.playSuccessChime();
      return newMember;
    },
    [settings, settings.enableSound]
  );

  const addMember = useCallback(
    (memberData: Omit<CustomerMember, "id">) => {
      const newMember: CustomerMember = {
        ...memberData,
        id: `mbr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };

      setMembers((prev) => {
        const updated = [newMember, ...prev];
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
        return updated;
      });

      fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      }).catch(() => {});

      if (settings.enableSound) posAudio.playSuccessChime();
      return newMember;
    },
    [settings.enableSound]
  );

  const updateMember = useCallback((id: string, updates: Partial<CustomerMember>) => {
    setMembers((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      return updated;
    });

    setActiveMember((curr) => (curr?.id === id ? { ...curr, ...updates } : curr));

    fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  }, []);

  const deleteMember = useCallback(
    (id: string) => {
      if (settings.enableSound) posAudio.playErrorBuzz();
      setMembers((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
        return updated;
      });

      setActiveMember((curr) => (curr?.id === id ? null : curr));

      fetch(`/api/members?id=${id}`, {
        method: "DELETE",
      }).catch(() => {});
    },
    [settings.enableSound]
  );

  const adjustMemberPoints = useCallback(
    (id: string, deltaPoints: number, reason?: string) => {
      setMembers((prev) => {
        const updated = prev.map((m) => {
          if (m.id === id) {
            const newPoints = Math.max(0, m.points + deltaPoints);
            return {
              ...m,
              points: newPoints,
              notes: reason ? `${m.notes ? m.notes + " | " : ""}${reason}` : m.notes,
            };
          }
          return m;
        });
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
        return updated;
      });

      setActiveMember((curr) => {
        if (curr?.id === id) {
          return { ...curr, points: Math.max(0, curr.points + deltaPoints) };
        }
        return curr;
      });

      if (settings.enableSound) posAudio.playSuccessChime();
    },
    [settings.enableSound]
  );

  // Full Two-Way Sync with Supabase Cloud
  const syncWithSupabaseCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setSyncStatus("syncing");
    try {
      if (!supabase) {
        setSyncStatus("error");
        return { success: false, message: "Supabase client not initialized." };
      }

      // 1. Sync Products (Upsert all catalog items)
      const productPayload = products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        cost_price: p.costPrice,
        stock: p.stock,
        min_stock_alert: p.minStockAlert,
        unit: p.unit,
        image_url: p.imageUrl,
        is_favorite: p.isFavorite || false,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("products").upsert(productPayload);

      // 2. Sync Transactions
      if (transactions.length > 0) {
        const txPayload = transactions.map((t) => ({
          id: t.id,
          invoice_number: t.invoiceNumber,
          timestamp: t.timestamp,
          items: t.items,
          subtotal: t.subtotal,
          discount_total: t.discountTotal,
          tax_total: t.taxTotal,
          grand_total: t.grandTotal,
          payment_method: t.paymentMethod,
          amount_paid: t.amountPaid,
          change_due: t.changeDue,
          profit: t.profit,
          currency: t.currency,
          customer_name: t.customerName || null,
          customer_phone: t.customerPhone || null,
          cashier_name: t.cashierName,
          notes: t.notes || null,
        }));
        await supabase.from("transactions").upsert(txPayload);
      }

      // 3. Sync Members
      if (members.length > 0) {
        const memberPayload = members.map((m) => ({
          id: m.id,
          member_code: m.memberCode,
          name: m.name,
          phone: m.phone,
          email: m.email || null,
          tier: m.tier,
          membership_type: m.membershipType,
          points: m.points,
          total_spent: m.totalSpent,
          total_visits: m.totalVisits,
          discount_percent: m.discountPercent,
          notes: m.notes || null,
          created_at: m.createdAt,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("customer_members").upsert(memberPayload);
      }

      // 4. Ping keepalive
      await fetch("/api/keepalive?source=manual-sync").catch(() => {});

      setIsSupabaseConnected(true);
      setSyncStatus("synced");
      if (settings.enableSound) posAudio.playSuccessChime();

      return {
        success: true,
        message: `Sinkronisasi Supabase Cloud Berhasil! (${products.length} produk, ${members.length} member & ${transactions.length} transaksi)`,
      };
    } catch (err: any) {
      setSyncStatus("error");
      return {
        success: false,
        message: `Gagal sinkronisasi: ${err?.message || String(err)}`,
      };
    }
  }, [products, transactions, members, settings.enableSound]);

  // Export JSON Backup
  const exportBackupJSON = useCallback(() => {
    const backupData = {
      version: "2.1.0",
      exportDate: new Date().toISOString(),
      storeSettings: settings,
      products,
      members,
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
  }, [settings, products, members, transactions, debts, cashflow]);

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
    setMembers(INITIAL_SAMPLE_MEMBERS);
    setActiveMember(null);
    setPointsToRedeem(0);
    setCart([]);
    setTransactions([]);
    setDebts([]);
    setCashflow([]);
    setSettings(DEFAULT_STORE_SETTINGS);
    setAppendingToInvoice(null);

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_UMKM_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_SAMPLE_MEMBERS));
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
        isSupabaseConnected,
        syncStatus,
        language,
        currency,
        t,
        members,
        activeMember,
        pointsToRedeem,
        memberDiscountAmount,
        pointsDiscountAmount,
        potentialPointsEarned,
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
        syncWithSupabaseCloud,
        setActiveMember,
        setPointsToRedeem,
        identifyMemberByBarcodeOrPhone,
        quickRegisterMember,
        addMember,
        updateMember,
        deleteMember,
        adjustMemberPoints,
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
