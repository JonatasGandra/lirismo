import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente anônimo, sem cookies. Lê só o que a RLS libera (itens publicados).
 * Por não tocar em cookies, as páginas públicas continuam estáticas (ISR).
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
