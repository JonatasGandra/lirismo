"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { CloseIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { CoverArt } from "@/components/songs/CoverArt";
import { formatDuration } from "@/lib/format";
import { usePlayer } from "./PlayerProvider";

/** Mini-player fixo no rodapé: aparece ao tocar e acompanha a navegação. */
export function MiniPlayer() {
  const { current, isPlaying, isLoading, time, duration, toggle, seek, close } = usePlayer();
  if (!current) return null;

  const total = duration > 0 ? duration : (current.duration ?? 0);
  const fill = total > 0 ? Math.min(100, (time / total) * 100) : 0;

  return (
    <>
      <div className="mini-player-spacer" aria-hidden="true" />
      <section className={`mini-player${isPlaying ? " is-playing" : ""}`} aria-label="Tocando agora">
        <CoverArt title={current.title} coverUrl={current.coverUrl} sizes="48px" small className="mini-player-cover" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <Link href={`/musicas#${current.slug}`} className="mini-player-title">
              {current.title}
            </Link>
            <span className="player-time shrink-0">
              {formatDuration(time)} / {formatDuration(total)}
            </span>
          </div>
          <input
            type="range"
            className="range"
            min={0}
            max={total > 0 ? total : 1}
            step={1}
            value={Math.min(time, total || time)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label={`Posição em ${current.title}`}
            aria-valuetext={`${formatDuration(time)} de ${formatDuration(total)}`}
            style={{ "--fill": `${fill}%` } as CSSProperties}
          />
        </div>

        <button
          type="button"
          className={`player-toggle player-toggle--small${isPlaying && isLoading ? " is-loading" : ""}`}
          onClick={() => toggle(current)}
          aria-label={isPlaying ? `Pausar ${current.title}` : `Tocar ${current.title}`}
        >
          {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </button>
        <button type="button" className="icon-button" onClick={close} aria-label="Fechar o player">
          <CloseIcon className="h-4 w-4" />
        </button>
      </section>
    </>
  );
}
