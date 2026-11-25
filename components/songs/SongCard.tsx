import { SongPlayer } from "@/components/player/SongPlayer";
import type { PlayableSong } from "@/lib/types";
import { CoverArt } from "./CoverArt";

type Props = {
  song: PlayableSong;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
};

/** Card de música: capa (ou placeholder), título e o player (com a duração). */
export function SongCard({ song, headingLevel: Heading = "h3", priority = false }: Props) {
  return (
    <article id={song.slug} className="song-card">
      <CoverArt
        title={song.title}
        coverUrl={song.coverUrl}
        priority={priority}
        sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
      />
      <Heading className="mt-5 font-title text-title-md font-medium leading-tight">{song.title}</Heading>
      <SongPlayer song={song} className="mt-3" />
    </article>
  );
}
