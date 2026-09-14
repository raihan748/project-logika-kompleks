import { NextResponse } from "next/server";
import { CashflowRecord } from "../../../lib/types/pos";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

let memoryCashflow: CashflowRecord[] = [];

export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: dbCashflow, error } = await supabase
      .from("cashflow_records")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error && dbCashflow && dbCashflow.length > 0) {
      const mapped: CashflowRecord[] = dbCashflow.map((row) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        amount: Number(row.amount),
        currency: row.currency || "IDR",
        timestamp: row.timestamp,
        notes: row.notes || "",
        operator: row.operator || "Kasir Toko",
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
    total: memoryCashflow.length,
    data: memoryCashflow,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, currency, notes, operator } = body;

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
      operator: operator || "Kasir Toko",
    };

    memoryCashflow = [newRecord, ...memoryCashflow];

    // Simpan ke Supabase
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("cashflow_records").upsert({
        id: newRecord.id,
        type: newRecord.type,
        category: newRecord.category,
        amount: newRecord.amount,
        currency: newRecord.currency,
        timestamp: newRecord.timestamp,
        notes: newRecord.notes,
        operator: newRecord.operator,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Arus kas berhasil dicatat di Supabase cloud.",
      data: newRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
