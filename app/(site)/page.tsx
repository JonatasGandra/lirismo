import { BloomHero } from "@/components/home/BloomHero";
import { CatalogLink } from "@/components/home/CatalogLink";
import { FeaturedPoems } from "@/components/home/FeaturedPoem";
import { SongCard } from "@/components/songs/SongCard";
import { Coverflow } from "@/components/site/Coverflow";
import { EmptyState } from "@/components/site/EmptyState";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getPublishedPoems, getPublishedSongs } from "@/lib/data";

export const revalidate = 3600;

/** Quantas músicas passam no carrossel da capa (a página de músicas tem todas). */
const SONG_CAROUSEL_SIZE = 12;

// Capa → poemas em carrossel (o último no centro) → "Abrir catálogo" (leva a
// /poemas, a lista com os títulos) → músicas em carrossel. O título "Músicas"
// leva à página com todas.
export default async function HomePage() {
  const [poems, songs] = await Promise.all([getPublishedPoems(), getPublishedSongs()]);
  const songItems = songs.slice(0, SONG_CAROUSEL_SIZE).map((song, index) => ({
    key: song.id,
    label: song.title,
    content: <SongCard song={song} priority={index === 0} />,
  }));

  return (
    <>
      <BloomHero />

      {poems.length > 0 ? (
        <>
          <FeaturedPoems poems={poems} />
          <Reveal>
            <CatalogLink />
          </Reveal>
        </>
      ) : (
        <section id="destaque" className="scroll-mt-24 px-4 py-24">
          <EmptyState
            title="O jardim está sendo plantado"
            text="Os primeiros versos e canções ainda estão brotando. Volte em breve."
          />
        </section>
      )}

      {songItems.length > 0 ? (
        <section className="px-4 py-20 sm:py-28">
          <Reveal>
            <SectionHeading kicker="Para ouvir" title="Músicas" href="/musicas" />
          </Reveal>
          <Reveal className="mt-10" delay={150}>
            <Coverflow items={songItems} label="Músicas mais recentes" variant="song" />
          </Reveal>
        </section>
      ) : null}
    </>
  );
}
