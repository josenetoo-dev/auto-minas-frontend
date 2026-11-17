import Link from "next/link";
import { featuredCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import SearchBox from "./search-box";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await featuredCars(6).catch(() => null);

  return (
    <div className="am-page-wide space-y-6 sm:space-y-8">
      <section className="am-hero">
        <div className="am-hero-content">
          <div className="max-w-2xl">
            <p className="am-eyebrow">Marketplace automotivo de Minas Gerais</p>
            <h1 className="am-title mt-3">
              Encontre o próximo carro com <span className="gold-text">mais contexto</span> para decidir.
            </h1>
            <p className="am-subtitle mt-4">
              Busque veículos, analise o anúncio e negocie diretamente com o vendedor dentro do Auto Minas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/carros" className="btn-gold">Explorar veículos</Link>
              <Link href="/vender" className="btn-outline">Anunciar veículo</Link>
            </div>
          </div>

          <div className="am-section-soft p-4 sm:p-5">
            <p className="am-eyebrow">Busca rápida</p>
            <h2 className="font-display mt-2 text-xl font-bold text-[#f6f3eb] sm:text-2xl">
              O que você procura?
            </h2>
            <div className="mt-4">
              <SearchBox />
            </div>
            <div className="am-metric-grid mt-4">
              <div className="am-metric"><strong>Direto</strong><span>Conversa com vendedor</span></div>
              <div className="am-metric"><strong>Analisado</strong><span>Anúncios moderados</span></div>
              <div className="am-metric"><strong>Seguro</strong><span>Fluxos de verificação</span></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="am-toolbar mb-4 sm:mb-5">
          <div>
            <p className="am-eyebrow">Vitrine</p>
            <h2 className="font-display mt-1 text-2xl font-bold text-[#f4f3ee] sm:text-3xl">
              Veículos em destaque
            </h2>
          </div>
          <Link href="/carros" className="market-text-link">Ver catálogo completo →</Link>
        </div>

        {!featured && (
          <p role="alert" className="am-section p-5 text-sm text-amber-200">
            A API Auto Minas está indisponível. Tente novamente em instantes.
          </p>
        )}

        {featured && featured.length === 0 && (
          <div className="am-section p-8 text-center">
            <p className="text-sm text-[#aaa69e]">Novos veículos aparecerão aqui após a aprovação dos anúncios.</p>
            <Link href="/vender" className="btn-outline mt-5">Cadastrar veículo</Link>
          </div>
        )}

        <div className="home-vehicle-grid grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {featured?.map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>

      <section className="am-section grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="am-eyebrow">Quer vender?</p>
          <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
            Publique seu veículo sem transformar o processo em um formulário interminável.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9d9ca3]">
            O fluxo de anúncio organiza os dados do veículo, fotos, documentos e revisão antes da publicação.
          </p>
        </div>
        <Link href="/vender" className="btn-gold w-full sm:w-auto">Começar anúncio</Link>
      </section>
    </div>
  );
}
