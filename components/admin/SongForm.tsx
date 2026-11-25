"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { CoverArt } from "@/components/songs/CoverArt";
import { createSong, updateSong, type SongInput } from "@/lib/actions/songs";
import {
  AUDIO_BUCKET,
  COVERS_BUCKET,
  COVER_MAX_SIDE,
  COVER_MIME_TYPES,
  MAX_AUDIO_BYTES,
  MAX_COVER_BYTES,
  MAX_VIDEO_BYTES,
  isMp3,
  isMp4,
} from "@/lib/storage";
import { extractAudioAsMp3 } from "@/lib/extract-audio";
import { createClient } from "@/lib/supabase/client";
import { prepareCover, readAudioDuration, removeUploaded, uploadWithProgress, type UploadedFile } from "@/lib/upload";

export type EditableSong = {
  id: string;
  title: string;
  published: boolean;
  audio_path: string;
  cover_path: string | null;
  duration_s: number | null;
  audioUrl: string;
  coverUrl: string | null;
};

type Step = { label: string; progress: number };

const MB = 1024 * 1024;
const megabytes = (bytes: number) => `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;

/**
 * Formulário de música. O MP3 e a capa sobem direto do navegador para o
 * Supabase Storage (com barra de progresso); só os metadados passam pela
 * Server Action. Se salvar falhar, os arquivos enviados são apagados.
 */
export function SongForm({ song }: { song?: EditableSong }) {
  const router = useRouter();
  const [title, setTitle] = useState(song?.title ?? "");
  const [published, setPublished] = useState(song?.published ?? true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = step !== null;

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function handleAudio(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    const reject = (message: string) => {
      event.target.value = "";
      setAudioFile(null);
      setError(message);
    };
    if (file && !isMp3(file) && !isMp4(file)) return reject("Escolha um MP3 ou um vídeo MP4.");
    if (file && isMp3(file) && file.size > MAX_AUDIO_BYTES) {
      return reject(`O MP3 tem ${megabytes(file.size)}. O limite é 50 MB — exporte a 128–192 kbps.`);
    }
    if (file && isMp4(file) && file.size > MAX_VIDEO_BYTES) {
      return reject(`O vídeo tem ${megabytes(file.size)}. O limite é 2 GB.`);
    }
    setAudioFile(file);
  }

  function handleCover(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (file && !COVER_MIME_TYPES.includes(file.type)) {
      event.target.value = "";
      setCoverFile(null);
      setError("A capa precisa ser JPG, PNG ou WebP.");
      return;
    }
    if (file && file.size > MAX_COVER_BYTES) {
      event.target.value = "";
      setCoverFile(null);
      setError(`A capa tem ${megabytes(file.size)}. O limite é 5 MB.`);
      return;
    }
    setCoverFile(file);
    if (file) setRemoveCover(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Dê um título à música.");
    if (!song && !audioFile) return setError("Escolha a música (MP3 ou vídeo MP4).");

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return setError("Sua sessão expirou. Entre de novo para enviar.");

    const uploaded: UploadedFile[] = [];
    let destination = "/painel";

    try {
      // 1–3. (MP4 → só o áudio, em MP3) + duração + MP3 direto para audio/{uuid}.mp3
      let audioPath = song?.audio_path ?? "";
      let duration = song?.duration_s ?? null;
      if (audioFile) {
        let mp3 = audioFile;
        duration = null;
        if (isMp4(audioFile)) {
          const label = "Extraindo o áudio do vídeo…";
          setStep({ label, progress: 0 });
          // O conversor avisa o progresso centenas de vezes; só redesenha quando o % muda.
          let shown = 0;
          const extracted = await extractAudioAsMp3(audioFile, (progress) => {
            const percent = Math.floor(progress * 100);
            if (percent === shown) return;
            shown = percent;
            setStep({ label, progress: percent / 100 });
          });
          if (extracted.file.size > MAX_AUDIO_BYTES) {
            throw new Error(
              `O áudio extraído tem ${megabytes(extracted.file.size)}. O limite é 50 MB (cerca de 35 minutos).`,
            );
          }
          mp3 = extracted.file;
          duration = extracted.duration;
        }
        if (duration === null) {
          setStep({ label: "Lendo a duração…", progress: 0 });
          duration = await readAudioDuration(mp3);
        }
        audioPath = `${crypto.randomUUID()}.mp3`;
        setStep({ label: "Enviando o MP3…", progress: 0 });
        await uploadWithProgress({
          bucket: AUDIO_BUCKET,
          path: audioPath,
          body: mp3,
          contentType: "audio/mpeg",
          accessToken: session.access_token,
          onProgress: (progress) => setStep({ label: "Enviando o MP3…", progress }),
        });
        uploaded.push({ bucket: AUDIO_BUCKET, path: audioPath });
      }

      // 4. Capa redimensionada (máx. 1200 px) para covers/{uuid}.webp
      let coverPath = removeCover ? null : (song?.cover_path ?? null);
      if (coverFile) {
        setStep({ label: "Preparando a capa…", progress: 0 });
        const cover = await prepareCover(coverFile, COVER_MAX_SIDE);
        const path = `${crypto.randomUUID()}.${cover.ext}`;
        await uploadWithProgress({
          bucket: COVERS_BUCKET,
          path,
          body: cover.blob,
          contentType: cover.contentType,
          accessToken: session.access_token,
          onProgress: (progress) => setStep({ label: "Enviando a capa…", progress }),
        });
        uploaded.push({ bucket: COVERS_BUCKET, path });
        coverPath = path;
      }

      // 5. Metadados pela Server Action
      setStep({ label: "Salvando…", progress: 1 });
      const input: SongInput = {
        title: cleanTitle,
        audio_path: audioPath,
        cover_path: coverPath,
        duration_s: duration,
        published,
      };
      const result = song ? await updateSong(song.id, input) : await createSong(input);
      if (!result.ok) throw new Error(result.error);
      if (result.published) destination = `/musicas#${result.slug}`;
    } catch (failure) {
      // 6. Deu errado: apaga o que já tinha sido enviado.
      await removeUploaded(supabase, uploaded);
      setStep(null);
      setError(failure instanceof Error ? failure.message : "Algo deu errado. Tente de novo.");
      return;
    }

    router.push(destination);
  }

  const shownCover = coverPreview ?? (removeCover ? null : (song?.coverUrl ?? null));

  return (
    // O envio do MP3 precisa do JavaScript; o method="post" só evita que, se ele
    // falhar, o título vá parar na URL.
    <form
      method="post"
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14"
    >
      <div className="space-y-7">
        <div>
          <label htmlFor="song-title" className="field-label">
            Título
          </label>
          <input
            id="song-title"
            className="field field--title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            autoComplete="off"
            disabled={busy}
          />
        </div>

        <div>
          <label htmlFor="song-audio" className="field-label">
            {song ? "Trocar a música (opcional)" : "Música (MP3 ou vídeo MP4)"}
          </label>
          <input
            id="song-audio"
            type="file"
            accept="audio/mpeg,.mp3,video/mp4,.mp4"
            className="field field-file"
            onChange={handleAudio}
            disabled={busy}
            aria-describedby="song-audio-hint"
          />
          <p id="song-audio-hint" className="field-hint">
            MP3 até 50 MB (a 128–192 kbps cada música fica com ~3–5 MB). Ou um vídeo MP4: só o
            áudio é extraído, em MP3, aqui no navegador — o vídeo não é enviado.
            {audioFile
              ? ` Selecionado: ${audioFile.name} (${megabytes(audioFile.size)})${
                  isMp4(audioFile) ? " — o áudio será extraído ao salvar." : "."
                }`
              : ""}
          </p>
          {song && !audioFile ? <audio controls preload="none" src={song.audioUrl} className="mt-4 w-full" /> : null}
        </div>

        <div>
          <label htmlFor="song-cover" className="field-label">
            Capa (opcional)
          </label>
          <input
            id="song-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field field-file"
            onChange={handleCover}
            disabled={busy}
            aria-describedby="song-cover-hint"
          />
          <p id="song-cover-hint" className="field-hint">
            JPG, PNG ou WebP até 5 MB. A imagem é reduzida para no máximo 1200 px antes do envio.
          </p>
          {song?.coverUrl && !coverFile ? (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="checkbox"
                checked={removeCover}
                onChange={(event) => setRemoveCover(event.target.checked)}
                disabled={busy}
              />
              Remover a capa atual
            </label>
          ) : null}
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            disabled={busy}
          />
          <span>Publicado</span>
        </label>

        {step ? (
          <div role="status" aria-live="polite" className="space-y-2">
            <div className="flex justify-between text-sm text-muted">
              <span>{step.label}</span>
              <span className="tabular-nums">{Math.round(step.progress * 100)}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={step.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(step.progress * 100)}
            >
              <div className="progress-fill" style={{ transform: `scaleX(${step.progress})` }} />
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Enviando…" : "Salvar"}
          </button>
          <Link href="/painel" className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </div>

      <aside aria-label="Como o card vai aparecer" className="preview-card self-start">
        <p className="eyebrow mb-5">Como vai aparecer</p>
        {shownCover ? (
          <div className="cover">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
            <img src={shownCover} alt="" className="cover-image absolute inset-0 h-full w-full" />
          </div>
        ) : (
          <CoverArt title={title || "?"} coverUrl={null} sizes="20rem" />
        )}
        <p className="mt-5 font-title text-title-md font-medium leading-tight">{title.trim() || "Sem título"}</p>
      </aside>
    </form>
  );
}
