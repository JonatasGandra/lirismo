import Link from "next/link";
import { PoemBody } from "@/components/poems/PoemBody";
import { Coverflow } from "@/components/site/Coverflow";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { formatMinimalDate, toRoman } from "@/lib/format";
import { excerptPoem } from "@/lib/poem";
import type { CatalogPoem } from "@/lib/types";

/** Quantos poemas passam no carrossel da capa (o catálogo tem todos). */
const CAROUSEL_SIZE = 12;

/**
 * "Em destaque": os poemas mais recentes num carrossel em perspectiva — o último
 * no centro, os vizinhos desfocados atrás, um de cada lado. O cartão do centro
 * leva ao poema inteiro (ao passar o mouse ele sobe e o título fica lilás).
 */
export function FeaturedPoems({ poems }: { poems: CatalogPoem[] }) {
  const items = poems.slice(0, CAROUSEL_SIZE).map((poem) => ({
    key: poem.id,
    label: poem.title,
    content: <PoemCard poem={poem} />,
  }));

  return (
    <section id="destaque" className="scroll-mt-24 px-4 py-24 sm:py-32">
      <Reveal>
        <SectionHeading kicker="O mais recente" title="Em destaque" />
      </Reveal>

      <Reveal className="mt-10" delay={150}>
        <Coverflow items={items} label="Poemas mais recentes" variant="poem" />
      </Reveal>
    </section>
  );
}

/** Cartão do poema (até 12 versos, por estrofes inteiras); o cartão inteiro é o link. */
function PoemCard({ poem }: { poem: CatalogPoem }) {
  const { text, truncated } = excerptPoem(poem.body, 12);

  return (
    <Link
      href={`/poemas/${poem.slug}`}
      className="featured-card"
      aria-label={`Ler o poema “${poem.title}”`}
      draggable={false}
    >
      <header className="text-center">
        <span className="numeral">{toRoman(poem.number)}</span>
        <time dateTime={poem.created_at} className="minimal-date">
          {formatMinimalDate(poem.created_at)}
        </time>
        <h3 className="featured-title">{poem.title}</h3>
      </header>
      <PoemBody body={text} className="poem-centered mt-10" />
      {truncated ? (
        <p className="poem-ellipsis text-center" aria-hidden="true">
          · · ·
        </p>
      ) : null}
    </Link>
  );
}
