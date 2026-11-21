import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { commercialPlans, sellerProfile } from "@/lib/commercial";
import SellerPlanFlow from "@/components/seller-plan-flow";
import Link from "next/link";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/account-plans.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Solicitar plano" };

export default async function SellerPlansPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const query = await searchParams;
  const [plans, session] = await Promise.all([
    commercialPlans().catch(() => []),
    getSession(),
  ]);
  const profile = session ? await sellerProfile().catch(() => null) : null;
  const plan = plans.find((item) => item.codigo === query.plano);
  if (!plan) notFound();
  return (
    <div className="plan-intent-screen">
      <header className="plan-intent-topbar">
        <HistoryBackButton fallback="/planos" className="plan-intent-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="plan-intent-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="plan-intent-content">
        <header className="plan-intent-heading">
          <h1>Contratação</h1>
          <p>Revise o plano escolhido e envie sua solicitação.</p>
        </header>

        {!session ? (
          <section className="plan-intent-gate">
            <h2>Entre para continuar</h2>
            <p>O plano {plan.nome} está selecionado. Faça login para avançar.</p>
            <Link href={`/login?next=${encodeURIComponent(`/vender/planos?plano=${plan.codigo}`)}`}>Entrar ou criar conta</Link>
          </section>
        ) : !profile?.identificacaoInformada ? (
          <section className="plan-intent-gate">
            <h2>Complete sua identificação</h2>
            <p>Preencha sua identificação para solicitar um plano.</p>
            <Link href={`/vender?plano=${encodeURIComponent(plan.codigo)}`}>Preencher identificação</Link>
          </section>
        ) : (
          <SellerPlanFlow plan={plan} />
        )}
      </main>

      <div className="plan-intent-glow" aria-hidden="true" />
    </div>
  );
}
