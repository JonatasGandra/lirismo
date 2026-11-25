import { pickUniqueSlug, slugify } from "@/lib/slug";
import type { ServerSupabase } from "@/lib/supabase/server";

type Table = "poems" | "songs";
type InsertResult = { ok: true; slug: string } | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";

async function findUniqueSlug(supabase: ServerSupabase, table: Table, base: string): Promise<string> {
  const { data, error } = await supabase.from(table).select("slug").like("slug", `${base}%`);
  if (error) throw new Error(`Não foi possível gerar o endereço: ${error.message}`);
  return pickUniqueSlug(base, ((data ?? []) as { slug: string }[]).map((row) => row.slug));
}

/**
 * Insere a linha com um slug único gerado do título. Se outro salvamento
 * pegar o mesmo slug no meio do caminho, tenta de novo.
 */
export async function insertWithUniqueSlug(
  supabase: ServerSupabase,
  table: Table,
  title: string,
  row: Record<string, unknown>,
): Promise<InsertResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    let slug: string;
    try {
      slug = await findUniqueSlug(supabase, table, slugify(title));
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    const { error } = await supabase.from(table).insert({ ...row, slug });
    if (!error) return { ok: true, slug };
    if (error.code !== UNIQUE_VIOLATION) return { ok: false, error: `Não foi possível salvar: ${error.message}` };
  }

  return { ok: false, error: "Não foi possível gerar um endereço único para este título." };
}
