"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { normalizePoem } from "@/lib/poem";
import { revalidateSite } from "@/lib/revalidate";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

export type PoemFormState = { error?: string } | undefined;

/**
 * Cria (id vazio) ou atualiza um poema.
 * normalizePoem → slug → inserir/atualizar → revalidar → ir para o poema.
 */
export async function savePoem(_prev: PoemFormState, formData: FormData): Promise<PoemFormState> {
  const { supabase } = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = normalizePoem(String(formData.get("body") ?? ""));
  const published = formData.get("published") === "on";

  if (!title) return { error: "Dê um título ao poema." };
  if (title.length > 200) return { error: "O título pode ter no máximo 200 caracteres." };
  if (!body) return { error: "O poema está vazio." };

  let slug: string;

  if (id) {
    if (!isUuid(id)) return { error: "Poema inválido." };
    // Na edição o slug é mantido, para não quebrar links já compartilhados.
    const { data, error } = await supabase
      .from("poems")
      .update({ title, body, published, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("slug")
      .maybeSingle();

    if (error) return { error: `Não foi possível salvar: ${error.message}` };
    if (!data) return { error: "Poema não encontrado." };
    slug = (data as { slug: string }).slug;
  } else {
    const result = await insertWithUniqueSlug(supabase, "poems", title, { title, body, published });
    if (!result.ok) return { error: result.error };
    slug = result.slug;
  }

  revalidateSite();
  // Rascunho não aparece no site público: volta para o painel.
  redirect(published ? `/poemas/${slug}` : "/painel");
}

export async function deletePoem(id: string): Promise<void> {
  const { supabase } = await requireUser();
  if (!isUuid(id)) throw new Error("Poema inválido.");

  const { error } = await supabase.from("poems").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível excluir o poema: ${error.message}`);

  revalidateSite();
}
