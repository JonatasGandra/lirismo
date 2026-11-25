import Link from "next/link";
import { deletePoem } from "@/lib/actions/poems";
import { deleteSong } from "@/lib/actions/songs";
import { formatDate } from "@/lib/format";
import { DeleteButton } from "./DeleteButton";

export type AdminItem = { id: string; slug: string; title: string; published: boolean; created_at: string };

type Props = {
  kind: "poem" | "song";
  heading: string;
  items: AdminItem[];
  emptyText: string;
};

export function AdminList({ kind, heading, items, emptyText }: Props) {
  const base = kind === "poem" ? "/painel/poema" : "/painel/musica";
  const headingId = `lista-${kind}`;

  return (
    <section className="panel-card overflow-hidden" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
        <h2 id={headingId} className="font-title text-title-md font-medium">
          {heading} <span className="text-muted">({items.length})</span>
        </h2>
        <Link href={`${base}/novo`} className="text-button">
          + Adicionar
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 font-poem text-lg italic text-muted sm:px-7">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const publicHref = kind === "poem" ? `/poemas/${item.slug}` : `/musicas#${item.slug}`;
            const remove = kind === "poem" ? deletePoem.bind(null, item.id) : deleteSong.bind(null, item.id);

            return (
              <li key={item.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-7">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-title text-xl font-medium">{item.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                    <span className={item.published ? "badge badge--live" : "badge badge--draft"}>
                      {item.published ? "Publicado" : "Rascunho"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {item.published ? (
                    <Link href={publicHref} className="text-button">
                      Ver
                    </Link>
                  ) : null}
                  <Link href={`${base}/${item.id}`} className="text-button">
                    Editar
                  </Link>
                  <DeleteButton action={remove} itemTitle={item.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
