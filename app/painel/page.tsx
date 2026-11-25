import Link from "next/link";
import { AdminList, type AdminItem } from "@/components/admin/AdminList";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const { supabase } = await requireUser();

  // Com a sessão do autor, a RLS também devolve os rascunhos.
  const [poems, songs] = await Promise.all([
    supabase.from("poems").select("id, slug, title, published, created_at").order("created_at", { ascending: false }),
    supabase.from("songs").select("id, slug, title, published, created_at").order("created_at", { ascending: false }),
  ]);
  if (poems.error) throw new Error(`Não foi possível carregar os poemas: ${poems.error.message}`);
  if (songs.error) throw new Error(`Não foi possível carregar as músicas: ${songs.error.message}`);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Área do autor</p>
          <h1 className="mt-2 font-title text-title-xl font-medium leading-tight">O que vamos publicar hoje?</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/painel/poema/novo" className="btn">
            Novo poema
          </Link>
          <Link href="/painel/musica/novo" className="btn-ghost">
            Nova música
          </Link>
        </div>
      </div>

      <AdminList
        kind="poem"
        heading="Poemas"
        items={(poems.data ?? []) as AdminItem[]}
        emptyText="Nenhum poema ainda. O primeiro verso espera por você."
      />
      <AdminList
        kind="song"
        heading="Músicas"
        items={(songs.data ?? []) as AdminItem[]}
        emptyText="Nenhuma música ainda."
      />
    </div>
  );
}
