import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/**
 * Keep-alive: projetos gratuitos do Supabase pausam após 1 semana sem uso.
 * O Vercel Cron (vercel.json) chama esta rota a cada 3 dias, enviando
 * "Authorization: Bearer ${CRON_SECRET}".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSupabaseConfigured) {
    return Response.json({ ok: false, error: "Supabase não configurado" }, { status: 500 });
  }

  const { error } = await createPublicClient().from("poems").select("id").limit(1);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, at: new Date().toISOString() });
}
