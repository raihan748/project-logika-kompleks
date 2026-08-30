import { NextResponse } from "next/server";
import { INITIAL_UMKM_PRODUCTS } from "../../../lib/data/umkm-catalog";

export async function GET() {
  const summary = {
    generatedAt: new Date().toISOString(),
    system: "WarungPro POS Enterprise Engine",
    activeSKUCount: INITIAL_UMKM_PRODUCTS.length,
    lowStockThreshold: 10,
    lowStockCount: INITIAL_UMKM_PRODUCTS.filter((p) => p.stock <= p.minStockAlert).length,
    currency: "IDR",
  };

  return NextResponse.json({
    success: true,
    data: summary,
  });
}
