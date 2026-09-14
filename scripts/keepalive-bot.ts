/**
 * WARUNGPRO POS - SUPABASE KEEPALIVE BOT DAEMON
 * Skrip untuk menjalankan pemantauan heartbeat Supabase secara mandiri.
 * Cara eksekusi: npx tsx scripts/keepalive-bot.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zzpnqmghzkaqwpkphvpz.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_RY_e_q6UIZVwr2i88AbBFA_-cLDRgUn";

async function pingSupabase(): Promise<void> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] 📡 Mengirimkan heartbeat ping ke Supabase...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      console.log(`[${timestamp}] ✅ Supabase ACTIVE! HTTP ${response.status} (${elapsed}ms)`);
    } else {
      console.log(`[${timestamp}] ⚠️ Supabase merespons HTTP ${response.status} (${elapsed}ms)`);
    }

    // Rekam log jika tabel ada
    await fetch(`${SUPABASE_URL}/rest/v1/keepalive_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: response.ok ? "OK" : "WARN",
        response_time_ms: elapsed,
        source: "local-daemon-bot",
        pinged_at: timestamp,
      }),
    }).catch(() => {});
  } catch (err: any) {
    console.error(`[${timestamp}] ❌ Gagal menghubungi Supabase:`, err?.message || err);
  }
}

// Eksekusi pertama kali
pingSupabase();

// Jika dijalankan sebagai daemon background runner (misal setiap 30 menit)
if (process.argv.includes("--daemon")) {
  console.log("🤖 Mode Daemon Aktif: Bot akan mengirimkan heartbeat setiap 30 menit...");
  setInterval(pingSupabase, 30 * 60 * 1000);
}
