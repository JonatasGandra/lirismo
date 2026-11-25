// Utilitários de upload que rodam só no navegador (usados pelo formulário de música).
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Lê a duração de um MP3 com um <audio> temporário (evento loadedmetadata). */
export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    let settled = false;
    let timer = 0;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };

    timer = window.setTimeout(() => finish(null), 15_000);
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => {
      const seconds = audio.duration;
      finish(Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null);
    });
    audio.addEventListener("error", () => finish(null));
    audio.src = url;
  });
}

export type PreparedCover = { blob: Blob; ext: "webp" | "jpg"; contentType: string };

/**
 * Redimensiona a capa para no máximo `maxSide` px e converte para WebP.
 * Se o navegador não souber gerar WebP, usa JPG.
 */
export async function prepareCover(file: File, maxSide: number): Promise<PreparedCover> {
  const image = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const webp = await drawToBlob(image, width, height, "image/webp", 0.86);
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", contentType: "image/webp" };

  const jpg = await drawToBlob(image, width, height, "image/jpeg", 0.88, true);
  if (!jpg) throw new Error("Não foi possível processar a imagem neste navegador.");
  return { blob: jpg, ext: "jpg", contentType: "image/jpeg" };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui ler esta imagem. Tente um JPG, PNG ou WebP."));
    };
    image.src = url;
  });
}

function drawToBlob(
  image: HTMLImageElement,
  width: number,
  height: number,
  type: string,
  quality: number,
  opaque = false,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  if (opaque) {
    // JPG não tem transparência: fundo branco no lugar do preto.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

type UploadOptions = {
  bucket: string;
  path: string;
  body: Blob;
  contentType: string;
  accessToken: string;
  onProgress?: (fraction: number) => void;
};

/**
 * Envia um arquivo direto do navegador para o Supabase Storage (API REST),
 * com progresso. O supabase-js não expõe progresso de upload, por isso XHR.
 * O arquivo nunca passa pela Vercel (limite de ~4,5 MB por requisição).
 */
export function uploadWithProgress({
  bucket,
  path,
  body,
  contentType,
  accessToken,
  onProgress,
}: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", contentType);
    // Nomes são UUIDs (o arquivo nunca muda), então o cache pode ser longo:
    // economiza o egress do plano gratuito.
    xhr.setRequestHeader("Cache-Control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      let message = `Falha no envio (HTTP ${xhr.status}).`;
      try {
        const data = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        if (data.message || data.error) message = `Falha no envio: ${data.message ?? data.error}`;
      } catch {
        // resposta sem JSON: mantém a mensagem genérica
      }
      reject(new Error(message));
    };
    xhr.onerror = () =>
      reject(new Error("Falha de rede durante o envio. Verifique a conexão e tente de novo."));
    xhr.send(body);
  });
}

export type UploadedFile = { bucket: string; path: string };

type StorageRemover = {
  storage: { from(bucket: string): { remove(paths: string[]): PromiseLike<unknown> } };
};

/** Apaga arquivos já enviados quando o salvamento falha (passo 6 da seção 5). */
export async function removeUploaded(supabase: StorageRemover, files: UploadedFile[]): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const file of files) byBucket.set(file.bucket, [...(byBucket.get(file.bucket) ?? []), file.path]);
  await Promise.all(
    [...byBucket].map(async ([bucket, paths]) => {
      try {
        await supabase.storage.from(bucket).remove(paths);
      } catch {
        // melhor esforço: o erro principal já está sendo mostrado ao autor
      }
    }),
  );
}
