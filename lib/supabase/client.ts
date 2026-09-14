import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zzpnqmghzkaqwpkphvpz.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_RY_e_q6UIZVwr2i88AbBFA_-cLDRgUn";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Mendapatkan instance Supabase Client untuk browser / client-side.
 * Dilengkapi dengan fallback null jika kredensial tidak valid atau offline.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn("Gagal menginisialisasi Supabase client:", err);
      return null;
    }
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
