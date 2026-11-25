import Image from "next/image";

type Props = {
  title: string;
  coverUrl: string | null;
  sizes: string;
  /** Versão miniatura (mini-player): inicial menor. */
  small?: boolean;
  priority?: boolean;
  className?: string;
};

/**
 * Capa da música. Sem capa, mostra um placeholder em CSS (degradê lilás com a
 * inicial do título em cursiva) — nunca uma imagem quebrada.
 */
export function CoverArt({ title, coverUrl, sizes, small = false, priority = false, className }: Props) {
  const base = ["cover", className].filter(Boolean).join(" ");

  if (coverUrl) {
    return (
      <div className={base}>
        <Image src={coverUrl} alt="" fill sizes={sizes} priority={priority} className="cover-image" />
      </div>
    );
  }

  const initial = Array.from(title.trim())[0]?.toLocaleUpperCase("pt-BR") ?? "";
  const classes = [base, "cover-placeholder", small ? "cover-placeholder--small" : ""].filter(Boolean).join(" ");

  return <div className={classes} data-initial={initial} aria-hidden="true" />;
}
