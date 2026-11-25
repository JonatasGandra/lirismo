import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ScrollIndicator } from "@/components/site/ScrollIndicator";
import { site } from "@/lib/site";
import { themeTokens } from "@/lib/theme-tokens";
import { fontVariables } from "./fonts";
import "./theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  // Site pessoal: fora dos buscadores por padrão.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    locale: site.ogLocale,
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: themeTokens.bg,
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <head>
        {/* Sem JavaScript, nada fica escondido esperando a animação de entrada. */}
        <noscript>
          <style>
            {".reveal{opacity:1!important;transform:none!important;filter:none!important}" +
              ".bloom{height:100svh!important}.bloom-dedication{display:none}"}
          </style>
        </noscript>
      </head>
      <body>
        {children}
        <ScrollIndicator />
      </body>
    </html>
  );
}
