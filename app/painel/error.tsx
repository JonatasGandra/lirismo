"use client";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="eyebrow">Algo deu errado</p>
      <h1 className="mt-3 font-title text-title-xl font-medium">Não foi possível concluir</h1>
      <p className="mt-4 text-muted">{error.message || "Tente de novo em instantes."}</p>
      <button type="button" onClick={reset} className="btn mt-8">
        Tentar de novo
      </button>
    </div>
  );
}
