export function getQuickCashSuggestions(grandTotal: number): number[] {
  if (grandTotal <= 0) return [0];

  const suggestions = new Set<number>();
  suggestions.add(grandTotal); // Uang Pas

  // Pembulatan ke 5.000 terdekat
  const next5k = Math.ceil(grandTotal / 5000) * 5000;
  if (next5k > grandTotal) suggestions.add(next5k);

  // Pembulatan ke 10.000 terdekat
  const next10k = Math.ceil(grandTotal / 10000) * 10000;
  if (next10k > grandTotal) suggestions.add(next10k);

  // Pembulatan ke 20.000 terdekat
  const next20k = Math.ceil(grandTotal / 20000) * 20000;
  if (next20k > grandTotal) suggestions.add(next20k);

  // Pembulatan ke 50.000 terdekat
  const next50k = Math.ceil(grandTotal / 50000) * 50000;
  if (next50k > grandTotal) suggestions.add(next50k);

  // Pembulatan ke 100.000 terdekat
  const next100k = Math.ceil(grandTotal / 100000) * 100000;
  if (next100k > grandTotal) suggestions.add(next100k);

  // Lembaran uang besar standar berikutnya
  const nominals = [20000, 50000, 100000, 150000, 200000, 300000, 500000];
  for (const n of nominals) {
    if (n > grandTotal) {
      suggestions.add(n);
      break;
    }
  }

  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 6);
}
