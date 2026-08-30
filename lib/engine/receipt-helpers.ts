import { Transaction, StoreSettings } from "../types/pos";
import { formatCurrency } from "./currency-formatter";

/**
 * Format teks struk thermal 58mm / 80mm universal & multilingual
 */
export function generateThermalReceiptText(tx: Transaction, store: StoreSettings): string {
  const WIDTH = 38;
  const isEn = store.language === "en";
  const currency = tx.currency || store.currency || "IDR";

  const padCenter = (str: string) => {
    const spaces = Math.max(0, Math.floor((WIDTH - str.length) / 2));
    return " ".repeat(spaces) + str;
  };

  const padRow = (left: string, right: string) => {
    const available = WIDTH - right.length;
    return left.slice(0, available).padEnd(available, " ") + right;
  };

  const lineSeparator = "-".repeat(WIDTH);
  const doubleSeparator = "=".repeat(WIDTH);
  const fmt = (num: number) => formatCurrency(num, currency);

  const lines: string[] = [];

  // Header Toko
  lines.push(padCenter(store.storeName.toUpperCase()));
  lines.push(padCenter(store.address));
  lines.push(padCenter(`${isEn ? "Phone" : "Telp"}: ${store.phone}`));
  lines.push(doubleSeparator);

  // Info Transaksi
  lines.push(padRow(`${isEn ? "Invoice" : "No. Nota"} : ${tx.invoiceNumber}`, ""));
  lines.push(padRow(`${isEn ? "Date" : "Waktu"}    : ${new Date(tx.timestamp).toLocaleString(isEn ? "en-US" : "id-ID")}`, ""));
  lines.push(padRow(`${isEn ? "Cashier" : "Kasir"}  : ${tx.cashierName}`, `${isEn ? "Pay" : "Bayar"}: ${tx.paymentMethod}`));
  if (tx.customerName) {
    lines.push(padRow(`${isEn ? "Customer" : "Plgn"} : ${tx.customerName}`, ""));
  }
  lines.push(lineSeparator);

  // Daftar Barang
  for (const item of tx.items) {
    lines.push(item.product.name);
    const qtyPrice = `${item.quantity} x ${fmt(item.unitPrice)}`;
    lines.push(padRow(`  ${qtyPrice}`, fmt(item.subtotal)));
    if (item.discountAmount > 0) {
      lines.push(padRow(`  * ${isEn ? "Discount" : "Diskon"}`, `-${fmt(item.discountAmount)}`));
    }
  }

  lines.push(lineSeparator);

  // Subtotal & Tax
  lines.push(padRow(isEn ? "Subtotal" : "Subtotal", fmt(tx.subtotal)));
  if (tx.discountTotal > 0) {
    lines.push(padRow(isEn ? "Discount" : "Diskon Nota", `-${fmt(tx.discountTotal)}`));
  }
  if (tx.taxTotal > 0) {
    lines.push(padRow(`${store.taxName} (${store.taxRate}%)`, fmt(tx.taxTotal)));
  }

  lines.push(doubleSeparator);
  lines.push(padRow(isEn ? "TOTAL DUE" : "TOTAL BAYAR", fmt(tx.grandTotal)));
  lines.push(doubleSeparator);

  if (tx.paymentMethod === "KASBON") {
    lines.push(padRow(isEn ? "STATUS" : "STATUS", isEn ? "UNPAID (STORE CREDIT)" : "BELUM LUNAS (KASBON)"));
  } else {
    lines.push(padRow(`${isEn ? "Tendered" : "Diterima"} (${tx.paymentMethod})`, fmt(tx.amountPaid)));
    if (tx.changeDue > 0) {
      lines.push(padRow(isEn ? "Change Due" : "Kembalian", fmt(tx.changeDue)));
    }
  }

  lines.push(lineSeparator);

  // Footer
  lines.push(padCenter(store.receiptHeader));
  lines.push(padCenter(store.receiptFooter));
  lines.push(padCenter(`--- ${isEn ? "Thank You" : "Terima Kasih"} ---`));
  lines.push("\n\n");

  return lines.join("\n");
}

/**
 * Format pesan nota belanja yang ramah dan rapi untuk dikirim via WhatsApp
 */
export function generateWhatsAppMessage(tx: Transaction, store: StoreSettings): string {
  const isEn = store.language === "en";
  const currency = tx.currency || store.currency || "IDR";
  const fmt = (num: number) => formatCurrency(num, currency);

  const dateFormatted = new Date(tx.timestamp).toLocaleDateString(isEn ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let message = `*${isEn ? "SALES RECEIPT" : "NOTA PEMBELIAN"} - ${store.storeName.toUpperCase()}*\n`;
  message += `📍 ${store.address}\n`;
  message += `📞 ${store.phone}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `${isEn ? "Invoice No" : "No. Nota"} : *${tx.invoiceNumber}*\n`;
  message += `${isEn ? "Date" : "Tanggal"}  : ${dateFormatted}\n`;
  message += `${isEn ? "Cashier" : "Kasir"}    : ${tx.cashierName}\n`;
  if (tx.customerName) {
    message += `${isEn ? "Customer" : "Pelanggan"}: ${tx.customerName}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `*${isEn ? "Order Summary" : "Rincian Belanja"}:*\n`;
  tx.items.forEach((item, index) => {
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   ${item.quantity} ${item.product.unit} x ${fmt(item.unitPrice)} = *${fmt(item.subtotal)}*\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Subtotal    : ${fmt(tx.subtotal)}\n`;
  if (tx.discountTotal > 0) {
    message += `${isEn ? "Discount" : "Diskon"}      : -${fmt(tx.discountTotal)}\n`;
  }
  if (tx.taxTotal > 0) {
    message += `${store.taxName} (${store.taxRate}%)  : ${fmt(tx.taxTotal)}\n`;
  }
  message += `*${isEn ? "TOTAL DUE" : "TOTAL BAYAR"} : ${fmt(tx.grandTotal)}*\n`;

  if (tx.paymentMethod === "KASBON") {
    message += `${isEn ? "Method" : "Metode"}      : *${isEn ? "STORE CREDIT (Unpaid)" : "KASBON (Belum Lunas)"}*\n`;
  } else {
    message += `${isEn ? "Method" : "Metode"}      : ${tx.paymentMethod}\n`;
    message += `${isEn ? "Tendered" : "Diterima"}    : ${fmt(tx.amountPaid)}\n`;
    if (tx.changeDue > 0) {
      message += `${isEn ? "Change Due" : "Kembalian"}   : ${fmt(tx.changeDue)}\n`;
    }
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_${store.receiptFooter}_\n\n`;
  message += `🙏 *${isEn ? "Thank you for shopping at" : "Terima kasih telah berbelanja di"} ${store.storeName}!*`;

  return encodeURIComponent(message);
}
