import Link from "next/link";
import type { Metadata } from "next";
import { commercialPlans } from "@/lib/commercial";
import PlanCard from "@/components/plan-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos para anunciar", description: "Planos mensais Auto Minas." };

export default async function PlanosPage() {
  const plans = await commercialPlans().catch(() => null);
  return <main className="relative isolate overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,.14),transparent_62%)]" />
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[.28em] text-[#d4af37]">Planos Auto Minas</p>
        <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-[#f4f3ee] sm:text-5xl">Mais visibilidade para <span className="gold-text">seus veículos</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#a9a9b2] sm:text-lg">Escolha um plano mensal para anunciar e aproximar compradores e vendedores. A negociação e o pagamento do veículo acontecem diretamente entre as partes.</p>
      </div>
      {!plans && <div role="alert" className="mx-auto mt-10 max-w-4xl rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-center text-sm text-amber-200">Não foi possível carregar os planos agora. Tente novamente em instantes.</div>}
      {plans && <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        {plans.map((plan) => <PlanCard key={plan.codigo} plan={plan} href={`/vender/planos?plano=${encodeURIComponent(plan.codigo)}`} featured={plan.codigo === "PREMIUM"} />)}
      </div>}
      <div className="mx-auto mt-9 grid max-w-6xl gap-4 rounded-2xl border border-white/[.08] bg-[#101014]/80 p-5 sm:grid-cols-3 sm:p-7">
        {["Ferramentas para divulgar seus anúncios", "Chat e propostas para negociar diretamente", "Painel para acompanhar seus anúncios"].map((item, i) => <div key={item} className="flex gap-3 text-sm leading-6 text-[#c3c3cc]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#d4af37]/35 text-xs text-[#e9cd7c]">{i + 1}</span>{item}</div>)}
      </div>
      <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-5 text-[#85858f]">Os recursos acima descrevem ferramentas comuns da plataforma; benefícios exclusivos por plano ainda não foram definidos. A contratação demonstrativa não habilita serviços nem confirma pagamento. A cobrança será externa quando o processo comercial estiver disponível.</p>
      <div className="mx-auto mt-12 max-w-4xl border-t border-white/[.08] pt-7 text-center text-sm text-[#9b9ba4]">
        <p>Comprador e vendedor negociam o veículo fora do Auto Minas. A plataforma não processa o pagamento do veículo.</p>
        <Link href="/carros" className="mt-4 inline-flex min-h-11 items-center text-[#e9cd7c] underline underline-offset-4">Conhecer a vitrine de veículos</Link>
      </div>
    </section>
  </main>;
}
