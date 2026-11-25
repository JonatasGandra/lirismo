import { renderMonogram } from "@/lib/og";

// Ícone da tela inicial do iPhone (o iOS arredonda os cantos sozinho).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderMonogram(180, false);
}
