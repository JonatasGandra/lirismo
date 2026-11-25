import Link from "next/link";
import { PetalSvg } from "@/components/lily/PetalSvg";

export function NotFoundContent() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="lost-petal aspect-[20/32]" aria-hidden="true">
        <PetalSvg className="block h-full w-full" />
      </div>
      <p className="eyebrow">Erro 404</p>
      <h1 className="section-title">Esta pétala voou com o vento</h1>
      <p className="section-lede">A página que você procura não está neste jardim — talvez tenha mudado de lugar.</p>
      <Link href="/" className="btn mt-10">
        Voltar ao início
      </Link>
    </section>
  );
}
