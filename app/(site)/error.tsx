"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="eyebrow">Algo saiu do lugar</p>
      <h1 className="section-title">Um vento forte passou</h1>
      <p className="section-lede">Não foi possível carregar esta página agora. Tente de novo em instantes.</p>
      <button type="button" onClick={reset} className="btn mt-10">
        Tentar de novo
      </button>
    </section>
  );
}
