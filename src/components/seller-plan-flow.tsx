"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommercialContract, CommercialPlan } from "@/lib/commercial";

type Props = { plan: CommercialPlan; contract: CommercialContract };
type Intent = {
  id: number;
  codigoPlano: string;
  nomePlano: string;
  mensalidade: number;
  status: string;
  situacaoFinanceira: string;
};

export default function SellerPlanFlow({ plan, contract }: Props) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function registerIntent() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/commercial/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoPlano: plan.codigo }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível registrar a intenção.");
      setIntent(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  const price = Number(plan.mensalidade).toLocaleString("pt-BR", {
    style: "currency",
    currency: plan.moeda,
  });

  return (
    <div className="plan-intent-flow">
      <section className="plan-intent-summary">
        <div className="plan-intent-summary-icon" aria-hidden="true">♛</div>
        <div>
          <small>Plano selecionado</small>
          <h2>{plan.nome}</h2>
          <strong>{price}<span>{plan.periodicidade === "MENSAL" ? " / mês" : " / contratação"}</span></strong>
        </div>
      </section>

      <section className="plan-intent-steps">
        <div className="is-done"><i>✓</i><span>Plano</span></div>
        <div className={acknowledged ? "is-done" : "is-active"}><i>{acknowledged ? "✓" : "2"}</i><span>Revisão</span></div>
        <div className={intent ? "is-done" : acknowledged ? "is-active" : ""}><i>{intent ? "✓" : "3"}</i><span>Intenção</span></div>
      </section>

      <section className="plan-intent-contract">
        <div className="plan-intent-contract-heading">
          <div>
            <small>DEMO · versão {contract.versao}</small>
            <h2>{contract.titulo}</h2>
          </div>
          <span>Não publicado</span>
        </div>

        <div className="plan-intent-contract-copy">
          {contract.conteudo}
        </div>

        <label className="plan-intent-ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={!!intent}
          />
          <span>
            Li a minuta demonstrativa e entendo que este registro <strong>não é pagamento, não ativa assinatura e não constitui aceite contratual definitivo.</strong>
          </span>
        </label>
      </section>

      <section className="plan-intent-warning">
        <strong>Fluxo comercial ainda demonstrativo</strong>
        <p>O backend registra apenas a intenção. Pagamento, cartão, cobrança e ativação automática continuam desabilitados.</p>
      </section>

      <button
        type="button"
        className="plan-intent-submit"
        disabled={busy || !!intent || !acknowledged}
        onClick={() => void registerIntent()}
      >
        {intent ? "Intenção registrada" : busy ? "Registrando…" : "Registrar intenção"}
      </button>

      {intent && (
        <section className="plan-intent-success" role="status">
          <span>✓</span>
          <div>
            <strong>Intenção registrada</strong>
            <p>Status: {intent.status} · situação financeira: {intent.situacaoFinanceira}</p>
          </div>
          <Link href="/assinatura">Acompanhar →</Link>
        </section>
      )}

      {error && <p role="alert" className="plan-intent-error">{error}</p>}
    </div>
  );
}
