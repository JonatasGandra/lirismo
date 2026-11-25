// Extrai só o áudio de um vídeo MP4, no navegador, e o entrega como MP3.
// O vídeo nunca é enviado: só o MP3 resultante sobe para o Storage, então o
// bucket, as regras e o player continuam iguais (tudo é MP3).
//
// Usa o Mediabunny, que lê o vídeo aos pedaços (sem carregá-lo inteiro na
// memória), e o codificador LAME em WebAssembly do @mediabunny/mp3-encoder.
// As duas bibliotecas só são baixadas quando alguém escolhe um MP4.

/** Taxas de amostragem que o MP3 aceita; fora delas, o áudio é reamostrado para 44,1 kHz. */
const MP3_SAMPLE_RATES = [48_000, 44_100, 32_000, 24_000, 22_050, 16_000, 12_000, 11_025, 8_000];
const MP3_BITRATE = 192_000;

export type ExtractedAudio = { file: File; duration: number | null };

export async function extractAudioAsMp3(
  video: File,
  onProgress?: (fraction: number) => void,
): Promise<ExtractedAudio> {
  const mb = await import("mediabunny");
  // Navegadores não codificam MP3 sozinhos; o LAME (WASM) entra no lugar.
  if (!(await mb.canEncodeAudio("mp3"))) {
    const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
    registerMp3Encoder();
  }

  const input = new mb.Input({ formats: [mb.MP4, mb.QTFF], source: new mb.BlobSource(video) });
  try {
    let track: Awaited<ReturnType<typeof input.getPrimaryAudioTrack>>;
    try {
      track = await input.getPrimaryAudioTrack();
    } catch {
      throw new Error("Não consegui ler este vídeo. Confira se é mesmo um MP4.");
    }
    if (!track) throw new Error("Este vídeo não tem som: não há áudio para extrair.");

    const output = new mb.Output({ format: new mb.Mp3OutputFormat(), target: new mb.BufferTarget() });
    const conversion = await mb.Conversion.init({
      input,
      output,
      tracks: "primary",
      video: { discard: true },
      audio: {
        codec: "mp3",
        quality: new mb.Quality({ bitrate: MP3_BITRATE, bitrateMode: "constant" }),
        numberOfChannels: Math.min(track.numberOfChannels, 2),
        sampleRate: MP3_SAMPLE_RATES.includes(track.sampleRate) ? track.sampleRate : 44_100,
      },
      showWarnings: false,
    });

    if (!conversion.isValid) {
      const undecodable = conversion.discardedTracks.some(
        (discarded) => discarded.track.isAudioTrack() && discarded.reason === "undecodable_source_codec",
      );
      throw new Error(
        undecodable
          ? "Este navegador não consegue ler o áudio deste vídeo. Tente no Chrome ou no Edge atualizados, ou envie um MP3."
          : "Não consegui converter o áudio deste vídeo para MP3.",
      );
    }

    conversion.onProgress = (progress) => onProgress?.(Math.min(1, Math.max(0, progress)));
    await conversion.execute();

    const buffer = output.target.buffer;
    if (!buffer || buffer.byteLength === 0) throw new Error("A extração do áudio não gerou nenhum som.");

    let duration: number | null = null;
    try {
      const seconds = await track.computeDuration();
      duration = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null;
    } catch {
      // sem duração, o formulário tenta ler do próprio MP3
    }

    const name = `${video.name.replace(/\.[^.]+$/, "") || "musica"}.mp3`;
    return { file: new File([buffer], name, { type: "audio/mpeg" }), duration };
  } finally {
    input.dispose();
  }
}
