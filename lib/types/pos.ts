export type ProductCategory =
  | "sembako"        // Beras, Minyak, Gula, Tepung, Telur
  | "minuman"        // Kopi, Teh, Susu, Air Mineral, Minuman Dingin
  | "snack"          // Biskuit, Keripik, Cokelat, Roti
  | "makanan_siap"   // Nasi Goreng, Mie Ayam, Gorengan, Menu Warung
  | "bumbu_dapur"    // Mie Instan, Kecap, Saus, Bumbu Racik
  | "perawatan"      // Sabun, Sampo, Pasta Gigi, Deterjen
  | "rokok_tembakau" // Rokok, Korek
  | "lainnya";

export interface Product {
  id: string;
  sku: string;                 // Barcode 13 digit atau kode manual
  name: string;
  category: ProductCategory;
  price: number;               // Harga Jual
  costPrice: number;           // Harga Modal (HPP)
  stock: number;
  minStockAlert: number;       // Batas minimum peringatan stok
  unit: string;                // "pcs", "kg", "pouch", "bungkus", "botol", "porsi"
  imageUrl: string;
  isFavorite?: boolean;        // Item sering laku (muncul di tab favorit)
}

export interface CartItem {
  id: string;                  // Line ID
  product: Product;
  quantity: number;
  unitPrice: number;           // Harga satuan saat transaksi
  discountAmount: number;      // Diskon per baris (Rp)
  subtotal: number;            // (unitPrice * quantity) - discountAmount
}

export type PaymentMethod = "TUNAI" | "QRIS" | "TRANSFER" | "KASBON";

export interface Transaction {
  id: string;
  invoiceNumber: string;       // "NOTA-20260830-001"
  timestamp: string;           // ISO string
  items: CartItem[];
  subtotal: number;            // Total harga sebelum diskon nota
  discountTotal: number;       // Diskon nota
  grandTotal: number;          // Total bersih yang harus dibayar
  paymentMethod: PaymentMethod;
  amountPaid: number;          // Jumlah uang yang diserahkan pelanggan
  changeDue: number;           // Kembalian
  profit: number;              // Laba bersih = GrandTotal - Total(HPP * Qty)
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
  totalDebt: number;           // Total hutang akumulasi
  remainingDebt: number;       // Sisa hutang belum dibayar
  dueDate?: string;            // Tanggal jatuh tempo
  notes?: string;
  createdAt: string;
  payments: DebtPayment[];
  relatedInvoices: string[];   // Daftar nomor nota yang di-kasbon
}

export interface CashflowRecord {
  id: string;
  type: "KAS_MASUK" | "KAS_KELUAR";
  category: string;            // "Modal Awal", "Beli Es Batu", "Listrik Warung", "Kebersihan", "Lainnya"
  amount: number;
  timestamp: string;
  notes: string;
  operator: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  enableSound: boolean;
}
