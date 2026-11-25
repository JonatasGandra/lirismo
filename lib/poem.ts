// Quebras de linha "exóticas" que chegam ao colar do Word e de alguns apps:
// \r\n, \r, tab vertical, form feed e os separadores Unicode U+2028/U+2029.
const LINE_BREAKS = new RegExp(`\\r\\n?|[\\v\\f${String.fromCharCode(0x2028, 0x2029)}]`, "g");

/**
 * Normaliza o texto de um poema antes de salvar (seção 4 da especificação):
 * 1. converte \r\n e \r em \n;
 * 2. remove espaços no fim de cada linha (o recuo no início é preservado);
 * 3. colapsa 3+ quebras seguidas em exatamente uma linha em branco;
 * 4. remove linhas em branco no início e no fim do texto.
 */
export function normalizePoem(body: string): string {
  return body
    .replace(LINE_BREAKS, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/u, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

/** Primeiros versos não vazios, sem o recuo, para listas e descrições. */
export function firstVerses(body: string, count = 2): string[] {
  return body
    .split("\n")
    .map((verse) => verse.trim())
    .filter(Boolean)
    .slice(0, count);
}

/** Trecho do poema por estrofes inteiras, até `maxVerses` versos. */
export function excerptPoem(body: string, maxVerses = 12): { text: string; truncated: boolean } {
  const stanzas = body.split(/\n\s*\n/);
  const kept: string[] = [];
  let used = 0;

  for (const stanza of stanzas) {
    const verses = stanza.split("\n");
    if (used + verses.length > maxVerses) {
      if (kept.length === 0) kept.push(verses.slice(0, maxVerses).join("\n"));
      return { text: kept.join("\n\n"), truncated: true };
    }
    kept.push(stanza);
    used += verses.length;
  }

  return { text: kept.join("\n\n"), truncated: false };
}
