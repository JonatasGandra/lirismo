import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

// Capas das músicas vêm do bucket público `covers` do Supabase Storage.
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
];

// Também libera o host exato configurado (útil para domínio próprio do Supabase).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    });
  } catch {
    // URL inválida: o erro aparece de forma clara ao usar o cliente Supabase.
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
  // A foto do lírio usada nas imagens de compartilhamento geradas sob demanda.
  outputFileTracingIncludes: {
    "/**": ["./public/lirio/og-lily.jpg"],
  },
  experimental: {
    // O CSS do site é pequeno: vai embutido no HTML e não bloqueia a primeira pintura.
    inlineCss: true,
  },
};

export default nextConfig;
