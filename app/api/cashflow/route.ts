import { NextResponse } from "next/server";
import { CashflowRecord } from "../../../lib/types/pos";

let memoryCashflow: CashflowRecord[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    total: memoryCashflow.length,
    data: memoryCashflow,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, currency, notes } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { success: false, error: "Tipe kas dan nominal wajib diisi." },
        { status: 400 }
      );
    }

    const newRecord: CashflowRecord = {
      id: `cf_${Date.now()}`,
      type: type === "KAS_MASUK" ? "KAS_MASUK" : "KAS_KELUAR",
      category: category || "Operasional Toko",
      amount: Math.max(0, Number(amount)),
      currency: currency || "IDR",
      timestamp: new Date().toISOString(),
      notes: notes || "",
      operator: "Kasir Toko",
    };

    memoryCashflow = [newRecord, ...memoryCashflow];

    return NextResponse.json({
      success: true,
      message: "Arus kas berhasil dicatat.",
      data: newRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
