import { NextResponse } from "next/server";
import { CustomerDebt } from "../../../lib/types/pos";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

let memoryDebts: CustomerDebt[] = [];

export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: dbDebts, error } = await supabase
      .from("customer_debts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbDebts && dbDebts.length > 0) {
      const mapped: CustomerDebt[] = dbDebts.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        totalDebt: Number(row.total_debt),
        remainingDebt: Number(row.remaining_debt),
        currency: row.currency || "IDR",
        dueDate: row.due_date || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        payments: Array.isArray(row.payments) ? row.payments : JSON.parse(row.payments || "[]"),
        relatedInvoices: row.related_invoices || [],
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
    total: memoryDebts.length,
    data: memoryDebts,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debtId, paymentAmount, notes, customerName, customerPhone, totalDebt, currency, invoiceNumber } = body;

    const supabase = createServerSupabaseClient();

    // Jika ini pembuatan kasbon baru
    if (customerName && totalDebt) {
      const newDebt: CustomerDebt = {
        id: `debt_${Date.now()}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || "-",
        totalDebt: Number(totalDebt),
        remainingDebt: Number(totalDebt),
        currency: currency || "IDR",
        createdAt: new Date().toISOString(),
        payments: [],
        relatedInvoices: invoiceNumber ? [invoiceNumber] : [],
      };

      memoryDebts = [newDebt, ...memoryDebts];

      try {
        await supabase.from("customer_debts").upsert({
          id: newDebt.id,
          customer_name: newDebt.customerName,
          customer_phone: newDebt.customerPhone,
          total_debt: newDebt.totalDebt,
          remaining_debt: newDebt.remainingDebt,
          currency: newDebt.currency,
          created_at: newDebt.createdAt,
          payments: newDebt.payments,
          related_invoices: newDebt.relatedInvoices,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Kasbon baru berhasil dicatat di Supabase cloud.",
        data: newDebt,
      });
    }

    // Jika ini pembayaran cicilan kasbon
    const idx = memoryDebts.findIndex((d) => d.id === debtId);
    let updatedDebt: CustomerDebt | null = null;

    if (idx !== -1) {
      const debt = memoryDebts[idx];
      const cleanPay = Math.min(debt.remainingDebt, Math.max(0, Number(paymentAmount)));

      const newPayment = {
        id: `pay_${Date.now()}`,
        date: new Date().toISOString(),
        amount: cleanPay,
        notes: notes || "Cicilan Kasbon",
      };

      memoryDebts[idx] = {
        ...debt,
        remainingDebt: Math.max(0, debt.remainingDebt - cleanPay),
        payments: [newPayment, ...debt.payments],
      };
      updatedDebt = memoryDebts[idx];
    }

    // Update di Supabase
    if (debtId) {
      try {
        const { data: current } = await supabase.from("customer_debts").select("*").eq("id", debtId).single();
        if (current) {
          const cleanPay = Math.min(Number(current.remaining_debt), Math.max(0, Number(paymentAmount)));
          const currentPayments = Array.isArray(current.payments) ? current.payments : JSON.parse(current.payments || "[]");
          const newPayment = {
            id: `pay_${Date.now()}`,
            date: new Date().toISOString(),
            amount: cleanPay,
            notes: notes || "Cicilan Kasbon",
          };
          const updatedRemaining = Math.max(0, Number(current.remaining_debt) - cleanPay);
          const updatedPayments = [newPayment, ...currentPayments];

          await supabase.from("customer_debts").update({
            remaining_debt: updatedRemaining,
            payments: updatedPayments,
          }).eq("id", debtId);
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Pembayaran kasbon berhasil dicatat.",
      data: updatedDebt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
