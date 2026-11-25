import Link from "next/link";
import { site } from "@/lib/site";

// Sem barra de navegação no topo: o rodapé leva às páginas.
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="mx-auto flex max-w-wide flex-col items-center gap-5 px-4 py-16 text-center">
        <p className="wordmark">{site.name}</p>
        <div>
          <p className="font-script text-4xl text-accent">{site.footerSignature}</p>
          <p className="footer-credit">feito com amor por {site.author}</p>
        </div>
        <nav aria-label="Páginas" className="flex flex-wrap justify-center gap-8">
          <Link href="/" className="nav-link">
            Início
          </Link>
          <Link href="/poemas" className="nav-link">
            Poemas
          </Link>
          <Link href="/musicas" className="nav-link">
            Músicas
          </Link>
        </nav>
        <p className="eyebrow">Poemas &amp; canções · {year}</p>
      </div>
    </footer>
  );
}
