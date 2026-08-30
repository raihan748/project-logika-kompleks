import { Transaction, StoreSettings } from "../types/pos";

/**
 * Format teks struk thermal 58mm (32 kolom) / 80mm (40 kolom)
 */
export function generateThermalReceiptText(tx: Transaction, store: StoreSettings): string {
  const WIDTH = 38;
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
  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");

  const lines: string[] = [];

  // Header Toko
  lines.push(padCenter(store.storeName.toUpperCase()));
  lines.push(padCenter(store.address));
  lines.push(padCenter(`Telp: ${store.phone}`));
  lines.push(doubleSeparator);

  // Info Transaksi
  lines.push(padRow(`Nota  : ${tx.invoiceNumber}`, ""));
  lines.push(padRow(`Waktu : ${new Date(tx.timestamp).toLocaleString("id-ID")}`, ""));
  lines.push(padRow(`Kasir : ${tx.cashierName}`, `Bayar: ${tx.paymentMethod}`));
  if (tx.customerName) {
    lines.push(padRow(`Plgn  : ${tx.customerName}`, ""));
  }
  lines.push(lineSeparator);

  // Daftar Barang
  for (const item of tx.items) {
    lines.push(item.product.name);
    const qtyPrice = `${item.quantity} x ${formatRp(item.unitPrice)}`;
    lines.push(padRow(`  ${qtyPrice}`, formatRp(item.subtotal)));
    if (item.discountAmount > 0) {
      lines.push(padRow("  * Diskon item", `-${formatRp(item.discountAmount)}`));
    }
  }

  lines.push(lineSeparator);

  // Total
  lines.push(padRow("Subtotal", formatRp(tx.subtotal)));
  if (tx.discountTotal > 0) {
    lines.push(padRow("Diskon Nota", `-${formatRp(tx.discountTotal)}`));
  }
  lines.push(doubleSeparator);
  lines.push(padRow("TOTAL BAYAR", formatRp(tx.grandTotal)));
  lines.push(doubleSeparator);

  if (tx.paymentMethod === "KASBON") {
    lines.push(padRow("STATUS", "BELUM LUNAS (KASBON)"));
  } else {
    lines.push(padRow(`Diterima (${tx.paymentMethod})`, formatRp(tx.amountPaid)));
    if (tx.changeDue > 0) {
      lines.push(padRow("Kembalian", formatRp(tx.changeDue)));
    }
  }

  lines.push(lineSeparator);

  // Footer
  lines.push(padCenter(store.receiptHeader));
  lines.push(padCenter(store.receiptFooter));
  lines.push(padCenter("--- Terima Kasih ---"));
  lines.push("\n\n");

  return lines.join("\n");
}

/**
 * Format pesan nota belanja yang ramah dan rapi untuk dikirim via WhatsApp
 */
export function generateWhatsAppMessage(tx: Transaction, store: StoreSettings): string {
  const formatRp = (num: number) => "Rp " + Math.round(num).toLocaleString("id-ID");
  const dateFormatted = new Date(tx.timestamp).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let message = `*NOTA PEMBELIAN - ${store.storeName.toUpperCase()}*\n`;
  message += `📍 ${store.address}\n`;
  message += `📞 ${store.phone}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `No. Nota : *${tx.invoiceNumber}*\n`;
  message += `Tanggal  : ${dateFormatted}\n`;
  message += `Kasir    : ${tx.cashierName}\n`;
  if (tx.customerName) {
    message += `Pelanggan: ${tx.customerName}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `*Rincian Belanja:*\n`;
  tx.items.forEach((item, index) => {
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   ${item.quantity} ${item.product.unit} x ${formatRp(item.unitPrice)} = *${formatRp(item.subtotal)}*\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Subtotal    : ${formatRp(tx.subtotal)}\n`;
  if (tx.discountTotal > 0) {
    message += `Diskon      : -${formatRp(tx.discountTotal)}\n`;
  }
  message += `*TOTAL BAYAR : ${formatRp(tx.grandTotal)}*\n`;

  if (tx.paymentMethod === "KASBON") {
    message += `Metode      : *KASBON (Hutang Belum Lunas)*\n`;
  } else {
    message += `Metode      : ${tx.paymentMethod}\n`;
    message += `Diterima    : ${formatRp(tx.amountPaid)}\n`;
    if (tx.changeDue > 0) {
      message += `Kembalian   : ${formatRp(tx.changeDue)}\n`;
    }
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_${store.receiptFooter}_\n\n`;
  message += `🙏 *Terima kasih telah berbelanja di ${store.storeName}!*`;

  return encodeURIComponent(message);
}
