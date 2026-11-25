import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Ornament } from "@/components/lily/Ornament";
import { PoemBody } from "@/components/poems/PoemBody";
import { BackButton } from "@/components/site/BackButton";
import { getPoemBySlug, getPublishedPoems } from "@/lib/data";
import { formatMinimalDate, toRoman } from "@/lib/format";
import { baseOpenGraph } from "@/lib/metadata";
import { firstVerses } from "@/lib/poem";
import { site } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const poems = await getPublishedPoems().catch(() => []);
  return poems.map((poem) => ({ slug: poem.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPoemBySlug(slug);
  if (!entry) return { title: "Poema não encontrado" };

  const { poem } = entry;
  const description = firstVerses(poem.body, 2).join(" / ") || site.description;
  return {
    title: poem.title,
    description,
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      title: poem.title,
      description,
      publishedTime: poem.created_at,
    },
  };
}

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default async function PoemPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getPoemBySlug(slug);
  if (!entry) notFound();

  const { poem, older, newer } = entry;

  return (
    <div className="relative">
      <div className="reading-progress" aria-hidden="true" />
      <BackButton href="/poemas" label="Voltar aos poemas" />

      <article className="mx-auto max-w-content px-4 pt-20 sm:pt-24">
        <header className="text-center">
          <span className="numeral numeral--lg mist">
            <span className="sr-only">Poema número {poem.number}: </span>
            <span aria-hidden="true">{toRoman(poem.number)}</span>
          </span>
          <time dateTime={poem.created_at} className="minimal-date mist" style={delay(80)}>
            {formatMinimalDate(poem.created_at)}
          </time>
          <h1 className="poem-title mist" style={delay(160)}>
            {poem.title}
          </h1>
          <Ornament className="mt-8" />
        </header>

        <PoemBody body={poem.body} className="poem--drift poem-centered mt-12" />

        <Ornament className="mt-16" />

        {older || newer ? (
          <nav className="poem-nav" aria-label="Outros poemas">
            {older ? (
              <Link href={`/poemas/${older.slug}`} className="poem-nav-link">
                <span className="eyebrow">Anterior</span>
                <span className="poem-nav-title">{older.title}</span>
              </Link>
            ) : null}
            {newer ? (
              <Link href={`/poemas/${newer.slug}`} className="poem-nav-link poem-nav-link--next">
                <span className="eyebrow">Próximo</span>
                <span className="poem-nav-title">{newer.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>
    </div>
  );
}
