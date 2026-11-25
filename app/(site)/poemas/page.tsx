import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/site/BackButton";
import { Chevron } from "@/components/site/Chevron";
import { EmptyState } from "@/components/site/EmptyState";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getPublishedPoems } from "@/lib/data";
import { plural } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const revalidate = 3600;
export const metadata: Metadata = pageMetadata("Poemas", site.poemsIntro);

// O catálogo: todos os poemas publicados, do mais novo ao mais antigo, só com o
// título. Cada linha é um link inteiro, com um chevron num círculo fino à
// direita (sempre visível, também no celular) que diz "abra".
export default async function PoemsPage() {
  const poems = await getPublishedPoems();

  return (
    <div className="relative px-4 pb-8 pt-20 sm:pt-24">
      <BackButton href="/" label="Voltar ao início" />

      <SectionHeading as="h1" kicker="Catálogo" title="Poemas">
        <p className="section-lede">{site.poemsIntro}</p>
        {poems.length > 0 ? <p className="eyebrow mt-5">{plural(poems.length, "poema", "poemas")}</p> : null}
      </SectionHeading>

      {poems.length === 0 ? (
        <EmptyState title="Nenhum poema ainda" text="O primeiro verso está a caminho." />
      ) : (
        <ol className="title-list">
          {poems.map((poem, index) => (
            <Reveal as="li" key={poem.id} delay={Math.min(index, 6) * 70}>
              <Link href={`/poemas/${poem.slug}`} className="title-row">
                <span className="title-row-name">{poem.title}</span>
                <span className="go-circle" aria-hidden="true">
                  <Chevron />
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      )}
    </div>
  );
}
