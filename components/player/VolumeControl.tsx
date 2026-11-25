"use client";

import { useRef, type CSSProperties } from "react";
import { VolumeIcon } from "@/components/icons";
import { usePlayer } from "./PlayerProvider";

/** Volume (some no iOS, onde o volume só muda pelos botões do aparelho). */
export function VolumeControl({ label }: { label: string }) {
  const { volume, setVolume, canSetVolume } = usePlayer();
  const lastAudible = useRef(1);

  if (!canSetVolume) return null;

  const muted = volume === 0;

  function toggleMute() {
    if (muted) {
      setVolume(lastAudible.current || 1);
    } else {
      lastAudible.current = volume;
      setVolume(0);
    }
  }

  return (
    <div className="volume">
      <button type="button" className="icon-button" onClick={toggleMute} aria-label={muted ? "Ativar o som" : "Silenciar"}>
        <VolumeIcon muted={muted} className="h-4 w-4" />
      </button>
      <input
        type="range"
        className="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label={`Volume: ${label}`}
        style={{ "--fill": `${volume * 100}%` } as CSSProperties}
      />
    </div>
  );
}
