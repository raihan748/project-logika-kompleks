import { SupportedCurrency, CURRENCY_CONFIGS } from "../i18n/translations";

/**
 * Format universal angka ke mata uang aktif dengan locale dan desimal yang tepat
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = "IDR"): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.IDR;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount);
  } catch {
    // Fallback jika browser tidak mengenali locale
    return `${config.symbol} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    })}`;
  }
}

/**
 * Hasilkan saran pecahan uang tunai cepat berdasarkan mata uang aktif
 */
export function getUniversalQuickCash(grandTotal: number, currency: SupportedCurrency = "IDR"): number[] {
  if (grandTotal <= 0) return [0];

  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.IDR;
  const suggestions = new Set<number>();
  suggestions.add(grandTotal); // Exact Amount

  if (currency === "IDR") {
    const next5k = Math.ceil(grandTotal / 5000) * 5000;
    if (next5k > grandTotal) suggestions.add(next5k);

    const next10k = Math.ceil(grandTotal / 10000) * 10000;
    if (next10k > grandTotal) suggestions.add(next10k);

    const next20k = Math.ceil(grandTotal / 20000) * 20000;
    if (next20k > grandTotal) suggestions.add(next20k);

    const next50k = Math.ceil(grandTotal / 50000) * 50000;
    if (next50k > grandTotal) suggestions.add(next50k);

    const next100k = Math.ceil(grandTotal / 100000) * 100000;
    if (next100k > grandTotal) suggestions.add(next100k);
  } else if (currency === "JPY") {
    const next1k = Math.ceil(grandTotal / 1000) * 1000;
    if (next1k > grandTotal) suggestions.add(next1k);

    const next5k = Math.ceil(grandTotal / 5000) * 5000;
    if (next5k > grandTotal) suggestions.add(next5k);

    const next10k = Math.ceil(grandTotal / 10000) * 10000;
    if (next10k > grandTotal) suggestions.add(next10k);
  } else {
    // Standard Decimals (USD, EUR, GBP, SGD, AUD, etc.)
    const next1 = Math.ceil(grandTotal);
    if (next1 > grandTotal) suggestions.add(next1);

    const next5 = Math.ceil(grandTotal / 5) * 5;
    if (next5 > grandTotal) suggestions.add(next5);

    const next10 = Math.ceil(grandTotal / 10) * 10;
    if (next10 > grandTotal) suggestions.add(next10);

    const next20 = Math.ceil(grandTotal / 20) * 20;
    if (next20 > grandTotal) suggestions.add(next20);

    const next50 = Math.ceil(grandTotal / 50) * 50;
    if (next50 > grandTotal) suggestions.add(next50);

    const next100 = Math.ceil(grandTotal / 100) * 100;
    if (next100 > grandTotal) suggestions.add(next100);
  }

  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 6);
}

/**
 * Ekspor data ke file CSV standar internasional
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;

  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
