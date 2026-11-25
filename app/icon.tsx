import { renderMonogram } from "@/lib/og";

// Ícone da aba: um "L" na serifada fina, em lilás sobre a noite.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return renderMonogram(64, true);
}
