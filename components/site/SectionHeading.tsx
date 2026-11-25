import Link from "next/link";
import type { ReactNode } from "react";
import { Ornament } from "@/components/lily/Ornament";

type Props = {
  kicker: string;
  title: string;
  as?: "h1" | "h2";
  /** Torna o título clicável (ex.: "Poemas" na capa leva ao catálogo). */
  href?: string;
  children?: ReactNode;
};

/** Cabeçalho de seção: rótulo de catálogo, título em serifada fina e o divisor. */
export function SectionHeading({ kicker, title, as: Heading = "h2", href, children }: Props) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{kicker}</p>
      <Heading className="section-title">
        {href ? (
          <Link href={href} className="section-title-link">
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      {children}
      <Ornament className="mt-7" />
    </header>
  );
}
