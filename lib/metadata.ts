import type { Metadata } from "next";
import { site } from "@/lib/site";

/** Campos comuns do Open Graph (repetidos porque cada página substitui o objeto inteiro). */
export const baseOpenGraph = {
  locale: site.ogLocale,
  siteName: site.name,
} as const;

export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { ...baseOpenGraph, type: "website", title: `${title} · ${site.name}`, description },
  };
}
