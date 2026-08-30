import { NextResponse } from "next/server";
import { CustomerDebt } from "../../../lib/types/pos";

let memoryDebts: CustomerDebt[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    total: memoryDebts.length,
    data: memoryDebts,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debtId, paymentAmount, notes } = body;

    const idx = memoryDebts.findIndex((d) => d.id === debtId);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Data kasbon tidak ditemukan." },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: "Pembayaran kasbon berhasil dicatat.",
      data: memoryDebts[idx],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
