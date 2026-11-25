import { UUID_PATTERN } from "@/lib/ids";
import { SUPABASE_URL } from "@/lib/supabase/env";

export const AUDIO_BUCKET = "audio";
export const COVERS_BUCKET = "covers";

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const COVER_MAX_SIDE = 1200;
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Nomes no Storage são sempre `{uuid}.mp3` e `{uuid}.{ext}` — nunca o nome original. */
export const AUDIO_PATH_RE = new RegExp(`^${UUID_PATTERN}\\.mp3$`);
export const COVER_PATH_RE = new RegExp(`^${UUID_PATTERN}\\.(webp|jpg|png)$`);

export function publicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function isMp3(file: File): boolean {
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return true;
  return file.type === "" && /\.mp3$/i.test(file.name);
}

/**
 * Vídeo MP4 escolhido como música: só o áudio é extraído (em MP3) no navegador
 * — o vídeo não é enviado —, por isso o limite pode ser bem maior que o do MP3.
 */
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

export function isMp4(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "audio/mp4") return true;
  return (file.type === "" || file.type === "application/octet-stream") && /\.mp4$/i.test(file.name);
}
