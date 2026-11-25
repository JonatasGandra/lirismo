import Link from "next/link";
import { notFound } from "next/navigation";
import { SongForm, type EditableSong } from "@/components/admin/SongForm";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { AUDIO_BUCKET, COVERS_BUCKET, publicUrl } from "@/lib/storage";
import type { Song } from "@/lib/types";

export const dynamic = "force-dynamic";

// /painel/musica/novo → criação; /painel/musica/{id} → edição.
export default async function SongEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "novo";
  let song: EditableSong | undefined;

  if (!isNew) {
    if (!isUuid(id)) notFound();
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, published, audio_path, cover_path, duration_s")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Não foi possível carregar a música: ${error.message}`);
    if (!data) notFound();

    const row = data as Pick<Song, "id" | "title" | "published" | "audio_path" | "cover_path" | "duration_s">;
    song = {
      ...row,
      audioUrl: publicUrl(AUDIO_BUCKET, row.audio_path),
      coverUrl: row.cover_path ? publicUrl(COVERS_BUCKET, row.cover_path) : null,
    };
  }

  return (
    <div>
      <Link href="/painel" className="text-button">
        ← Painel
      </Link>
      <h1 className="mt-4 font-title text-title-xl font-medium">{isNew ? "Nova música" : "Editar música"}</h1>
      <div className="mt-10">
        <SongForm song={song} />
      </div>
    </div>
  );
}
