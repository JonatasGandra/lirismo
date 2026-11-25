import { Footer } from "@/components/site/Footer";
import { NotFoundContent } from "@/components/site/NotFoundContent";

// 404 para endereços que não existem (fora do layout público, por isso traz
// o próprio rodapé).
export default function NotFound() {
  return (
    <>
      <main id="conteudo">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
