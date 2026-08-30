import { SupportedCurrency, SupportedLanguage } from "../i18n/translations";

export type ProductCategory =
  | "sembako"        // Groceries / Staples
  | "minuman"        // Beverages & Coffee
  | "snack"          // Snacks & Bakery
  | "makanan_siap"   // Ready-to-eat / F&B
  | "bumbu_dapur"    // Condiments & Noodles
  | "perawatan"      // Personal Care & Household
  | "rokok_tembakau" // Tobacco & Matches
  | "lainnya";       // Others / General

export interface Product {
  id: string;
  sku: string;                 // Global EAN-13, UPC-A, Code-128, or Custom SKU
  name: string;
  category: ProductCategory;
  price: number;               // Retail Price (in active currency unit)
  costPrice: number;           // Cost of Goods Sold (COGS / HPP)
  stock: number;
  minStockAlert: number;       // Low stock threshold
  unit: string;                // "pcs", "kg", "pouch", "box", "bottle", "portion"
  imageUrl: string;
  isFavorite?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;            // (unitPrice * quantity) - discountAmount
}

export type PaymentMethod = "TUNAI" | "CARD" | "QRIS" | "TRANSFER" | "KASBON";

export interface Transaction {
  id: string;
  invoiceNumber: string;       // Global Unique Invoice Number
  timestamp: string;           // ISO string
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeDue: number;
  profit: number;              // Net Profit = GrandTotal - Tax - Total(COGS * Qty)
  currency: SupportedCurrency;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  notes?: string;
}

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface CustomerDebt {
  id: string;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  remainingDebt: number;
  currency: SupportedCurrency;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  payments: DebtPayment[];
  relatedInvoices: string[];
}

export interface CashflowRecord {
  id: string;
  type: "KAS_MASUK" | "KAS_KELUAR";
  category: string;
  amount: number;
  currency: SupportedCurrency;
  timestamp: string;
  notes: string;
  operator: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  currency: SupportedCurrency;
  language: SupportedLanguage;
  taxEnabled: boolean;
  taxRate: number;             // Percentage e.g. 10 or 11
  taxName: string;             // "VAT", "GST", "Sales Tax", "PPN"
  receiptHeader: string;
  receiptFooter: string;
  enableSound: boolean;
}
