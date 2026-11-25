"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { site } from "@/lib/site";
import type { PlayableSong } from "@/lib/types";

type PlayerContextValue = {
  current: PlayableSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  time: number;
  duration: number;
  volume: number;
  /** false no iOS, que não deixa mudar o volume por código. */
  canSetVolume: boolean;
  toggle: (song: PlayableSong) => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  close: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer precisa estar dentro de <PlayerProvider>.");
  return context;
}

/**
 * Um único <audio preload="none"> para o site inteiro, no layout público:
 * tocar uma música pausa qualquer outra, e a música continua ao trocar de página.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentRef = useRef<PlayableSong | null>(null);
  const [current, setCurrent] = useState<PlayableSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [canSetVolume, setCanSetVolume] = useState(true);

  useEffect(() => {
    const probe = document.createElement("audio");
    probe.volume = 0.5;
    setCanSetVolume(probe.volume === 0.5);
  }, []);

  const play = useCallback((audio: HTMLAudioElement) => {
    setHasError(false);
    audio.play().catch((error: unknown) => {
      // AbortError: outra música foi escolhida antes desta começar.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsPlaying(false);
      setIsLoading(false);
      if (!(error instanceof DOMException && error.name === "NotAllowedError")) setHasError(true);
    });
  }, []);

  const toggle = useCallback(
    (song: PlayableSong) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentRef.current?.id === song.id) {
        if (audio.paused) play(audio);
        else audio.pause();
        return;
      }

      currentRef.current = song;
      setCurrent(song);
      setTime(0);
      setDuration(song.duration ?? 0);
      setIsLoading(true);
      audio.src = song.audioUrl;
      play(audio);
    },
    [play],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current || !Number.isFinite(seconds)) return;
    audio.currentTime = seconds;
    setTime(seconds);
  }, []);

  const setVolume = useCallback((next: number) => {
    const value = Math.min(1, Math.max(0, next));
    if (audioRef.current) audioRef.current.volume = value;
    setVolumeState(value);
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    currentRef.current = null;
    setCurrent(null);
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(false);
    setTime(0);
    setDuration(0);
  }, []);

  // Título e capa na tela bloqueada / central de controle do celular.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: site.name,
          artwork: current.coverUrl ? [{ src: current.coverUrl }] : [],
        })
      : null;
  }, [current]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      isPlaying,
      isLoading,
      hasError,
      time,
      duration,
      volume,
      canSetVolume,
      toggle,
      seek,
      setVolume,
      close,
    }),
    [current, isPlaying, isLoading, hasError, time, duration, volume, canSetVolume, toggle, seek, setVolume, close],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          const seconds = event.currentTarget.duration;
          if (Number.isFinite(seconds) && seconds > 0) setDuration(seconds);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setTime(0);
        }}
        onError={() => {
          if (!currentRef.current) return;
          setHasError(true);
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />
    </PlayerContext.Provider>
  );
}
