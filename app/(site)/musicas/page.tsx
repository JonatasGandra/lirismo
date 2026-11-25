import type { Metadata } from "next";
import { SongCard } from "@/components/songs/SongCard";
import { BackButton } from "@/components/site/BackButton";
import { EmptyState } from "@/components/site/EmptyState";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getPublishedSongs } from "@/lib/data";
import { plural } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const revalidate = 3600;
export const metadata: Metadata = pageMetadata("Músicas", site.songsIntro);

export default async function SongsPage() {
  const songs = await getPublishedSongs();

  return (
    <div className="relative px-4 pt-20 sm:pt-24">
      <BackButton href="/" label="Voltar ao início" />

      <SectionHeading as="h1" kicker="Catálogo" title="Músicas">
        <p className="section-lede">{site.songsIntro}</p>
        {songs.length > 0 ? <p className="eyebrow mt-5">{plural(songs.length, "música", "músicas")}</p> : null}
      </SectionHeading>

      {songs.length === 0 ? (
        <EmptyState title="Nenhuma música ainda" text="A primeira canção está sendo afinada." />
      ) : (
        <ul className="song-grid mx-auto mt-14 max-w-wide">
          {songs.map((song, index) => (
            <Reveal as="li" key={song.id} delay={(index % 3) * 120}>
              <SongCard song={song} headingLevel="h2" priority={index < 2} />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
