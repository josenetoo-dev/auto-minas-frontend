import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { commercialPlans, mySubscriptions } from "@/lib/commercial";
import PlanCard from "@/components/plan-card";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/account-plans.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos" };

export default async function PlanosPage() {
  const session = await getSession();
  const [plans, subscriptions] = await Promise.all([
    commercialPlans().catch(() => null),
    session ? mySubscriptions().catch(() => []) : Promise.resolve([]),
  ]);

  const current = subscriptions.find((item) => item.status === "ATIVA") ?? null;

  return (
    <div className="plans-reference-screen">
      <header className="plans-reference-topbar">
        <HistoryBackButton fallback="/" className="plans-reference-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="plans-reference-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="plans-reference-content">
        <section className="plans-reference-hero">
          <div>
            <h1>Planos</h1>
            <p>Escolha como deseja anunciar e acompanhe sua contratação.</p>
          </div>
          <div className="plans-reference-wallet" aria-hidden="true">▰</div>
        </section>

        {current && (
          <Link href="/assinatura" className="plans-current-card">
            <span className="plans-current-icon">♛</span>
            <div>
              <small>Plano atual</small>
              <strong>{current.nomePlano}</strong>
              <p>
                {current.vencimentoEm
                  ? `Vigência até ${new Date(current.vencimentoEm).toLocaleDateString("pt-BR")}`
                  : "Assinatura ativa"}
              </p>
            </div>
            <em>Ativo</em>
            <b>›</b>
          </Link>
        )}

        <section className="plans-reference-section">
          <div className="plans-reference-section-heading">
            <div>
              <h2>Planos disponíveis</h2>
              <p>Valores e benefícios são carregados do backend.</p>
            </div>
            {session && <Link href="/assinatura">Minhas assinaturas →</Link>}
          </div>

          {!plans && <p role="alert" className="plans-reference-error">Não foi possível carregar os planos.</p>}

          <div className="plans-reference-grid">
            {plans?.map((plan) => (
              <PlanCard
                key={plan.codigo}
                plan={plan}
                href={`/vender/planos?plano=${encodeURIComponent(plan.codigo)}`}
                active={current?.codigoPlano === plan.codigo}
              />
            ))}
          </div>
        </section>

        <section className="plans-reference-grounding">
          <strong>Contratação ainda não é pagamento.</strong>
          <p>
            O fluxo atual registra intenção comercial. Nenhum cartão é cobrado e nenhum plano é ativado sem confirmação válida do processo externo.
          </p>
        </section>

        <div className="plans-reference-actions">
          <Link href="/vender" className="plans-reference-free">Anunciar gratuitamente</Link>
          {session ? <Link href="/assinatura">Acompanhar minhas assinaturas</Link> : <Link href="/login?next=%2Fplanos">Entrar para continuar</Link>}
        </div>
      </main>

      <div className="plans-reference-glow" aria-hidden="true" />
    </div>
  );
}
