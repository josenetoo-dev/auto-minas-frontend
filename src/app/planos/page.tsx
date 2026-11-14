import Link from "next/link";
import type { Metadata } from "next";
import { commercialPlans } from "@/lib/commercial";
import PlanCard from "@/components/plan-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Como você quer anunciar?", description: "Anúncio avulso para um veículo e assinaturas mensais para lojas e revendedores." };

export default async function PlanosPage() {
  const plans = await commercialPlans().catch(() => null);
  return <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
    <header className="max-w-3xl"><p className="market-eyebrow">Uma escolha para o seu momento</p><h1 className="market-title mt-5">Você quer vender um carro<br /><em>ou movimentar seu estoque?</em></h1><p className="mt-6 max-w-xl text-sm leading-7 text-[#aaa69e]">Escolha a modalidade de anúncio. A negociação do veículo acontece diretamente entre comprador e vendedor, sem comissão sobre a venda.</p></header>
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      <section id="avulso" className="market-paper-card scroll-mt-28">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#63553e]">Pessoa física · Venda ocasional</p>
        <h2 className="mt-5 font-display text-4xl text-[#28251d]">Anúncio avulso</h2>
        <p className="mt-4 max-w-sm text-sm leading-7 text-[#675f51]">Para quem quer vender um veículo e seguir em frente.</p>
        <ul className="mt-7 space-y-4 border-y border-[#cbbfa7] py-6 text-sm text-[#4d4537]"><li>Um veículo por contratação</li><li>Pagamento único, sem renovação automática</li><li>Chat e propostas em um só lugar</li><li>Revisão do anúncio antes da publicação</li></ul>
        <p className="mt-6 text-xs leading-6 text-[#63553e]">Modalidade em preparação. Preço e prazo de exposição serão informados antes da contratação. Você já pode preparar seu anúncio para análise.</p>
        <Link href="/vender?modalidade=avulso" className="mt-7 flex min-h-12 items-center justify-between rounded-lg bg-[#282820] px-5 text-sm font-semibold text-[#f1e7d1] hover:bg-[#414035]">Preparar meu anúncio <span aria-hidden="true">↗</span></Link>
      </section>
      <section className="market-business-card">
        <p className="market-eyebrow">Empresa · Loja · Revendedor</p>
        <h2 className="mt-5 font-display text-4xl text-[#eee5d3]">Assinatura mensal</h2>
        <p className="mt-4 max-w-sm text-sm leading-7 text-[#aaa69e]">Para quem vende com frequência e precisa acompanhar vários anúncios.</p>
        <ul className="mt-7 space-y-4 border-y border-white/10 py-6 text-sm text-[#c4c0b6]"><li>Contratação recorrente por mês</li><li>Vitrine para seus veículos</li><li>Painel de anúncios, conversas e propostas</li><li>Revisão individual dos anúncios</li></ul>
        <p className="mt-6 text-xs leading-6 text-[#9c9689]">Limites de estoque, benefícios e regras de renovação serão definidos antes da contratação. Os valores abaixo são referências preliminares.</p>
        <a href="#profissionais" className="btn-gold mt-7 flex min-h-12 w-full justify-between">Conhecer as opções mensais <span aria-hidden="true">↗</span></a>
      </section>
    </div>
    <section id="profissionais" className="scroll-mt-28 pt-20">
      <p className="market-eyebrow">Para quem vive de vender</p><h2 className="market-heading mt-3">Opções para lojas e revendedores.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#aaa69e]">Valores de referência para a futura assinatura. A escolha registra uma intenção demonstrativa. Cobrança e ativação comercial ainda estão em preparação.</p>
      {!plans && <p role="alert" className="mt-8 rounded-xl border border-amber-500/25 p-5 text-sm text-amber-200">Não foi possível carregar as opções mensais. Tente novamente em instantes.</p>}
      {plans && <div className="mt-10 grid gap-5 lg:grid-cols-3">{plans.map(plan => <PlanCard key={plan.codigo} plan={plan} href={`/vender/planos?plano=${encodeURIComponent(plan.codigo)}`} featured={plan.codigo === "PROFESSIONAL"} />)}</div>}
    </section>
    <p className="mt-12 border-t border-white/10 pt-7 text-xs leading-6 text-[#8f8b82]">Preparar um anúncio ou registrar uma intenção não gera cobrança. Pagamentos e condições definitivas serão apresentados antes de qualquer contratação.</p>
  </div>;
}
