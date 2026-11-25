"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import type { PlayableSong } from "@/lib/types";
import { usePlayer } from "./PlayerProvider";
import { VolumeControl } from "./VolumeControl";

/**
 * Player do card: play/pause, barra arrastável, tempo atual/total e volume.
 * Com o foco no player, a barra de espaço toca/pausa.
 */
export function SongPlayer({ song, className }: { song: PlayableSong; className?: string }) {
  const { current, isPlaying, isLoading, hasError, time, duration, toggle, seek } = usePlayer();

  const isCurrent = current?.id === song.id;
  const playing = isCurrent && isPlaying;
  const total = isCurrent && duration > 0 ? duration : (song.duration ?? 0);
  const position = isCurrent ? Math.min(time, total || time) : 0;
  const fill = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== " ") return;
    // O botão já alterna com espaço por conta própria.
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    toggle(song);
  }

  const classes = ["player", playing ? "is-playing" : "", className ?? ""].filter(Boolean).join(" ");
  const toggleClasses = ["player-toggle", playing && isLoading ? "is-loading" : ""].filter(Boolean).join(" ");

  return (
    <div role="group" aria-label={`Player: ${song.title}`} className={classes} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={toggleClasses}
        onClick={() => toggle(song)}
        aria-label={playing ? `Pausar ${song.title}` : `Tocar ${song.title}`}
      >
        {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <input
          type="range"
          className="range"
          min={0}
          max={total > 0 ? total : 1}
          step={1}
          value={position}
          disabled={!isCurrent}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label={`Posição em ${song.title}`}
          aria-valuetext={`${formatDuration(position)} de ${formatDuration(total)}`}
          style={{ "--fill": `${fill}%` } as CSSProperties}
        />
        <div className="flex min-h-8 items-center justify-between gap-3">
          <span className="player-time" aria-live={isCurrent && hasError ? "polite" : undefined}>
            {isCurrent && hasError
              ? "Não foi possível tocar"
              : `${formatDuration(position)} / ${formatDuration(total)}`}
          </span>
          <VolumeControl label={song.title} />
        </div>
      </div>
    </div>
  );
}
