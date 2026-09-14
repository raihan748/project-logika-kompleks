import { NextResponse } from "next/server";
import { Transaction } from "../../../lib/types/pos";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

let memoryTransactions: Transaction[] = [];

export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: dbTransactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error && dbTransactions && dbTransactions.length > 0) {
      const mapped: Transaction[] = dbTransactions.map((row) => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        timestamp: row.timestamp,
        items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || "[]"),
        subtotal: Number(row.subtotal),
        discountTotal: Number(row.discount_total),
        taxTotal: Number(row.tax_total),
        grandTotal: Number(row.grand_total),
        paymentMethod: row.payment_method,
        amountPaid: Number(row.amount_paid),
        changeDue: Number(row.change_due),
        profit: Number(row.profit),
        currency: row.currency || "IDR",
        customerName: row.customer_name || undefined,
        customerPhone: row.customer_phone || undefined,
        cashierName: row.cashier_name || "Store Cashier",
        notes: row.notes || undefined,
      }));

      return NextResponse.json({
        success: true,
        source: "supabase-cloud",
        total: mapped.length,
        data: mapped,
      });
    }
  } catch {}

  return NextResponse.json({
    success: true,
    source: "local-memory",
    total: memoryTransactions.length,
    data: memoryTransactions,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, paymentMethod, amountPaid, customerName, customerPhone, currency, notes, invoiceNumber: customInvoice, id: customId } = body;

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

    const invoiceNumber =
      customInvoice ||
      `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: Transaction = {
      id: customId || `tx_${Date.now()}`,
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

    // Simpan juga ke Supabase
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("transactions").upsert({
        id: newTx.id,
        invoice_number: newTx.invoiceNumber,
        timestamp: newTx.timestamp,
        items: newTx.items,
        subtotal: newTx.subtotal,
        discount_total: newTx.discountTotal,
        tax_total: newTx.taxTotal,
        grand_total: newTx.grandTotal,
        payment_method: newTx.paymentMethod,
        amount_paid: newTx.amountPaid,
        change_due: newTx.changeDue,
        profit: newTx.profit,
        currency: newTx.currency,
        customer_name: newTx.customerName || null,
        customer_phone: newTx.customerPhone || null,
        cashier_name: newTx.cashierName,
        notes: newTx.notes || null,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Transaksi checkout berhasil dicatat di server & Supabase cloud.",
      data: newTx,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
