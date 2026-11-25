import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { BackButton } from "@/components/site/BackButton";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-16">
      <BackButton href="/" label="Voltar ao site" />
      <div className="w-full max-w-sm text-center">
        <h1 className="section-title">Entrar</h1>
        <p className="eyebrow mt-3">Área do autor</p>

        {!isSupabaseConfigured ? (
          <p className="notice mt-8 text-left">
            O Supabase ainda não foi configurado. Preencha as variáveis do <code>.env.local</code> (veja o README).
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
