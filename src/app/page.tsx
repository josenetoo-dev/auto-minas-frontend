import Link from "next/link";
import { featuredCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import { BRANDS } from "@/lib/constants";
import SearchBox from "./search-box";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await featuredCars(6).catch(() => null);
  return <div className="market-home">
    <section className="market-hero">
      <div className="market-hero-shade" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pt-14 lg:pb-16">
        <div className="max-w-xl">
          <p className="market-eyebrow">Auto Minas · Encontre o seu caminho</p>
          <h1 className="market-title mt-6">Seu próximo carro.<br /><em>Uma nova história.</em></h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#b7b3a9] sm:text-base">Encontre seu próximo veículo. Ou dê ao seu uma nova história, negociando direto com quem vai dirigir.</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link href="/carros" className="btn-gold">Explorar veículos <span aria-hidden="true">↗</span></Link>
            <Link href="/planos" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#e8ddc7] hover:text-white">Quero anunciar <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="relative mt-8 max-w-3xl lg:mt-10"><SearchBox /></div>
        <p className="mt-5 text-xs tracking-wide text-[#b7b3a9]">Revisão humana · Negociação direta · Sem comissão sobre a venda</p>
      </div>
    </section>
    <section className="border-y border-white/[.07] bg-[#0d0e10]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:px-8">
        <p className="shrink-0 text-xs uppercase tracking-[.18em] text-[#8e8b83]">Encontre por marca</p>
        <div className="flex flex-wrap gap-2 sm:ml-auto">{BRANDS.slice(0, 7).map(brand => <Link key={brand} href={`/carros?brand=${encodeURIComponent(brand)}`} className="market-brand">{brand}</Link>)}</div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="market-eyebrow">Na vitrine</p><h2 className="market-heading mt-3">Encontre a sua próxima direção.</h2></div><Link href="/carros" className="market-text-link">Ver todos os veículos <span aria-hidden="true">↗</span></Link></div>
      {!featured && <p role="alert" className="rounded-xl border border-amber-500/20 p-5 text-sm text-amber-200">A API Auto Minas está indisponível. Tente novamente em instantes.</p>}
      {featured && featured.length === 0 && <p className="rounded-xl border border-white/10 p-6 text-[#aaa69e]">Novos veículos aparecerão aqui após a aprovação dos anúncios.</p>}
      <div className="home-vehicle-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured?.map(car => <CarCard key={car.id} car={car} />)}</div>
    </section>
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <div className="mb-8"><p className="market-eyebrow">Para cada momento</p><h2 className="market-heading mt-3">Um veículo. Ou um negócio inteiro.</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <article className="market-paper-card"><p className="text-[11px] uppercase tracking-[.2em] text-[#63553e]">Para quem vende de vez em quando</p><h3 className="mt-5 font-display text-3xl text-[#25231e]">Um carro, uma nova história.</h3><p className="mt-4 max-w-sm text-sm leading-7 text-[#675f51]">Prepare um anúncio avulso para o seu veículo e acompanhe as conversas em um só lugar.</p><Link href="/planos#avulso" className="mt-8 flex min-h-12 items-center justify-between border-t border-[#c8bda6] pt-5 text-sm font-semibold text-[#30291e]">Conhecer o anúncio avulso <span aria-hidden="true">↗</span></Link></article>
        <article className="market-business-card"><p className="market-eyebrow">Para lojas e revendedores</p><h3 className="mt-5 font-display text-3xl">Seu estoque merece uma vitrine.</h3><p className="mt-4 max-w-sm text-sm leading-7 text-[#aaa69e]">Conheça as opções de assinatura mensal para quem anuncia veículos de forma recorrente.</p><Link href="/planos#profissionais" className="mt-8 flex min-h-12 items-center justify-between border-t border-white/10 pt-5 text-sm font-semibold text-[#dfc78f]">Ver opções para profissionais <span aria-hidden="true">↗</span></Link></article>
      </div>
    </section>
    <section className="border-t border-white/[.07] bg-[#0d0e10]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div><p className="market-eyebrow">Confiança se constrói</p><h2 className="market-heading mt-4">Mais clareza.<br />Em cada negociação.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#aaa69e]">A identidade, os documentos e o conteúdo dos anúncios passam por revisão humana. Você acompanha o andamento pela sua conta.</p><p className="mt-4 max-w-md text-xs leading-6 text-[#8c8982]">Biometria e consultas oficiais automáticas ainda não estão disponíveis. A revisão reduz riscos, mas não garante ausência de fraude.</p><Link href="/verificacoes" className="market-text-link mt-6">Conhecer a verificação <span aria-hidden="true">→</span></Link></div>
        <div className="market-paper-card"><p className="text-xs uppercase tracking-widest text-[#514633]">Como funciona</p><ol className="mt-6 space-y-5 text-sm leading-7 text-[#4d4537]"><li>Crie sua conta e entre automaticamente.</li><li>Prepare seu anúncio e confirme seu e-mail.</li><li>Acompanhe a revisão humana antes de publicar.</li><li>Converse e negocie diretamente com compradores.</li></ol></div>
      </div>
    </section>
  </div>;
}
