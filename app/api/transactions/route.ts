import { NextResponse } from "next/server";
import { Transaction } from "../../../lib/types/pos";

let memoryTransactions: Transaction[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    total: memoryTransactions.length,
    data: memoryTransactions,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, paymentMethod, amountPaid, customerName, customerPhone, currency, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Keranjang belanja kosong." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum: number, it: any) => sum + it.unitPrice * it.quantity, 0);
    const discountTotal = items.reduce((sum: number, it: any) => sum + (it.discountAmount || 0), 0);
    const taxTotal = items.reduce((sum: number, it: any) => sum + (it.taxAmount || 0), 0);
    const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
    const changeDue = paymentMethod === "KASBON" ? 0 : Math.max(0, (amountPaid || 0) - grandTotal);
    
    const profit = items.reduce((sum: number, it: any) => {
      const hpp = it.product?.costPrice || it.unitPrice * 0.75;
      return sum + (it.unitPrice - hpp) * it.quantity - (it.discountAmount || 0);
    }, 0);

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      invoiceNumber,
      timestamp: new Date().toISOString(),
      items,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentMethod: paymentMethod || "TUNAI",
      amountPaid: paymentMethod === "KASBON" ? 0 : (amountPaid || grandTotal),
      changeDue,
      profit,
      currency: currency || "IDR",
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      cashierName: "Store Cashier",
      notes,
    };

    memoryTransactions = [newTx, ...memoryTransactions];

    return NextResponse.json({
      success: true,
      message: "Transaksi checkout berhasil dicatat di server.",
      data: newTx,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
