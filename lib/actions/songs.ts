"use server";

import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { revalidateSite } from "@/lib/revalidate";
import { AUDIO_BUCKET, AUDIO_PATH_RE, COVERS_BUCKET, COVER_PATH_RE } from "@/lib/storage";
import type { ServerSupabase } from "@/lib/supabase/server";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

// Só metadados passam por aqui: o MP3 e a capa já foram enviados pelo
// navegador direto ao Storage (seção 5 da especificação).

export type SongInput = {
  title: string;
  audio_path: string;
  cover_path: string | null;
  duration_s: number | null;
  published: boolean;
};

export type SongActionResult =
  | { ok: true; slug: string; published: boolean }
  | { ok: false; error: string };

type StoredFile = { bucket: string; path: string };

function validate(input: SongInput): SongInput | string {
  const title = String(input?.title ?? "").trim();
  const audioPath = String(input?.audio_path ?? "");
  const coverPath = input?.cover_path ?? null;
  const duration = input?.duration_s;

  if (!title) return "Dê um título à música.";
  if (title.length > 200) return "O título pode ter no máximo 200 caracteres.";
  if (!AUDIO_PATH_RE.test(audioPath)) return "Arquivo de áudio inválido.";
  if (coverPath !== null && !COVER_PATH_RE.test(String(coverPath))) return "Arquivo de capa inválido.";

  return {
    title,
    audio_path: audioPath,
    cover_path: coverPath,
    duration_s:
      typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
    published: Boolean(input.published),
  };
}

export async function createSong(input: SongInput): Promise<SongActionResult> {
  const { supabase } = await requireUser();
  const song = validate(input);
  if (typeof song === "string") return { ok: false, error: song };

  const result = await insertWithUniqueSlug(supabase, "songs", song.title, song);
  if (!result.ok) return result;

  revalidateSite();
  return { ok: true, slug: result.slug, published: song.published };
}

/** Atualiza a música. Se o MP3 ou a capa foram trocados, apaga os arquivos antigos. */
export async function updateSong(id: string, input: SongInput): Promise<SongActionResult> {
  const { supabase } = await requireUser();
  if (!isUuid(id)) return { ok: false, error: "Música inválida." };

  const song = validate(input);
  if (typeof song === "string") return { ok: false, error: song };

  const { data: previous, error: readError } = await supabase
    .from("songs")
    .select("audio_path, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { ok: false, error: `Não foi possível ler a música: ${readError.message}` };
  if (!previous) return { ok: false, error: "Música não encontrada." };

  const { data, error } = await supabase
    .from("songs")
    .update({ ...song, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .single();
  if (error || !data) return { ok: false, error: `Não foi possível salvar: ${error?.message ?? "sem resposta"}` };

  const old = previous as { audio_path: string; cover_path: string | null };
  const stale: StoredFile[] = [];
  if (old.audio_path !== song.audio_path) stale.push({ bucket: AUDIO_BUCKET, path: old.audio_path });
  if (old.cover_path && old.cover_path !== song.cover_path) stale.push({ bucket: COVERS_BUCKET, path: old.cover_path });
  await removeFiles(supabase, stale);

  revalidateSite();
  return { ok: true, slug: (data as { slug: string }).slug, published: song.published };
}

/** Exclui a música e apaga o MP3 e a capa do Storage. */
export async function deleteSong(id: string): Promise<void> {
  const { supabase } = await requireUser();
  if (!isUuid(id)) throw new Error("Música inválida.");

  const { data: song, error: readError } = await supabase
    .from("songs")
    .select("audio_path, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw new Error(`Não foi possível ler a música: ${readError.message}`);

  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível excluir a música: ${error.message}`);

  if (song) {
    const files = song as { audio_path: string; cover_path: string | null };
    await removeFiles(supabase, [
      { bucket: AUDIO_BUCKET, path: files.audio_path },
      ...(files.cover_path ? [{ bucket: COVERS_BUCKET, path: files.cover_path }] : []),
    ]);
  }

  revalidateSite();
}

async function removeFiles(supabase: ServerSupabase, files: StoredFile[]): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const file of files) byBucket.set(file.bucket, [...(byBucket.get(file.bucket) ?? []), file.path]);

  await Promise.all(
    [...byBucket].map(async ([bucket, paths]) => {
      const { data, error } = await supabase.storage.from(bucket).remove(paths);
      // Sem a policy de SELECT no storage, o Supabase não apaga e não dá erro.
      if (error || (data?.length ?? 0) < paths.length) {
        console.error(
          `[storage] arquivos não removidos de "${bucket}":`,
          paths,
          error?.message ?? "confira as policies de storage (0001_init.sql)",
        );
      }
    }),
  );
}
