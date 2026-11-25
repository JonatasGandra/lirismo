/**
 * Espelho das cores de app/theme.css para lugares onde CSS variables não
 * funcionam: imagens Open Graph, ícone da Apple e cor da barra do navegador.
 * Ao mudar a paleta em app/theme.css, atualize aqui também.
 */
export const themeTokens = {
  bg: "#FBF8F4",
  surface: "#FFFDFB",
  text: "#2E2533",
  muted: "#6E6375",
  accent: "#9A7BBF",
  accentSoft: "#D5BFE9",
  accentWash: "#F5EEFB",
  petal: "#ECE0F4",
  leaf: "#7C9473",
  pollen: "#C98A5B",
  night: "#0B080E",
  nightText: "#F5EFF9",
  nightAccent: "#DCC6EE",
  nightMuted: "#B3A3C0",
} as const;
