import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * KEEPALIVE BOT API ENDPOINT
 * Endpoint ini menjaga instance database Supabase agar tetap aktif (tidak ter-pause/tidur)
 * dengan mengeksekusi kueri ping ringan dan mencatat log detak jantung (heartbeat).
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "http-ping";

  let dbStatus = "connected";
  let errorMessage: string | null = null;
  let responseTimeMs = 0;

  try {
    // 1. Eksekusi kueri ringan ke Supabase untuk mentrigger activity monitor
    const { data: pingData, error: pingError } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    responseTimeMs = Date.now() - startTime;

    if (pingError) {
      // Jika tabel products belum dibuat/di-seed, coba catat log langsung
      dbStatus = "warning";
      errorMessage = pingError.message;
    }

    // 2. Catat heartbeat ke tabel keepalive_logs
    try {
      await supabase.from("keepalive_logs").insert([
        {
          pinged_at: new Date().toISOString(),
          status: pingError ? "WARN" : "OK",
          response_time_ms: responseTimeMs,
          source,
          metadata: {
            userAgent: request.headers.get("user-agent") || "unknown",
            ip: request.headers.get("x-forwarded-for") || "direct",
          },
        },
      ]);
    } catch {
      // Abaikan jika tabel keepalive_logs belum di-create di Supabase
    }

    return NextResponse.json(
      {
        success: true,
        message: "Supabase Keepalive Heartbeat Pulse OK",
        database: {
          status: dbStatus,
          responseTimeMs,
          endpoint: "https://zzpnqmghzkaqwpkphvpz.supabase.co",
          error: errorMessage,
        },
        timestamp: new Date().toISOString(),
        keepaliveBot: {
          active: true,
          frequency: "Every 6 Hours (Automated via GitHub Actions + Client Pulse)",
          description: "Mencegah Supabase free-tier auto-pause 24/7",
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        message: "Supabase Keepalive Failed",
        error: err?.message || String(err),
        responseTimeMs,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
