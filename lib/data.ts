import { cache } from "react";
import { AUDIO_BUCKET, COVERS_BUCKET, publicUrl } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { CatalogPoem, PlayableSong, Song } from "@/lib/types";

type PoemRow = Omit<CatalogPoem, "number">;
type SongRow = Pick<Song, "id" | "slug" | "title" | "audio_path" | "cover_path" | "duration_s">;

/**
 * Poemas publicados, do mais recente ao mais antigo, já numerados no catálogo.
 * Um site pessoal tem poucos poemas: uma única consulta serve a capa, a lista
 * e a navegação anterior/próximo.
 */
export const getPublishedPoems = cache(async (): Promise<CatalogPoem[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from("poems")
    .select("id, slug, title, body, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar os poemas: ${error.message}`);

  const rows = (data ?? []) as PoemRow[];
  return rows.map((poem, index) => ({ ...poem, number: rows.length - index }));
});

/** Poema pelo slug, com o anterior (mais antigo) e o próximo (mais novo). */
export const getPoemBySlug = cache(async (slug: string) => {
  const poems = await getPublishedPoems();
  const index = poems.findIndex((poem) => poem.slug === slug);
  if (index === -1) return null;

  return {
    poem: poems[index],
    newer: poems[index - 1] ?? null,
    older: poems[index + 1] ?? null,
  };
});

export const getPublishedSongs = cache(async (): Promise<PlayableSong[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from("songs")
    .select("id, slug, title, audio_path, cover_path, duration_s")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar as músicas: ${error.message}`);

  return ((data ?? []) as SongRow[]).map(toPlayable);
});

export function toPlayable(song: SongRow): PlayableSong {
  return {
    id: song.id,
    slug: song.slug,
    title: song.title,
    audioUrl: publicUrl(AUDIO_BUCKET, song.audio_path),
    coverUrl: song.cover_path ? publicUrl(COVERS_BUCKET, song.cover_path) : null,
    duration: song.duration_s,
  };
}
