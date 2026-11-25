import Link from "next/link";
import { notFound } from "next/navigation";
import { PoemForm, type EditablePoem } from "@/components/admin/PoemForm";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";

export const dynamic = "force-dynamic";

// /painel/poema/novo → criação; /painel/poema/{id} → edição.
export default async function PoemEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "novo";
  let poem: EditablePoem | undefined;

  if (!isNew) {
    if (!isUuid(id)) notFound();
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("poems")
      .select("id, title, body, published")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Não foi possível carregar o poema: ${error.message}`);
    if (!data) notFound();
    poem = data as EditablePoem;
  }

  return (
    <div>
      <Link href="/painel" className="text-button">
        ← Painel
      </Link>
      <h1 className="mt-4 font-title text-title-xl font-medium">{isNew ? "Novo poema" : "Editar poema"}</h1>
      <div className="mt-10">
        <PoemForm poem={poem} />
      </div>
    </div>
  );
}
