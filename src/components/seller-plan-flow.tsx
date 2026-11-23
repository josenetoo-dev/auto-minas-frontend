"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommercialPlan } from "@/lib/commercial";

export default function SellerPlanFlow({ plan }: { plan: CommercialPlan }) {
  const [requested, setRequested] = useState(false);
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
      if (!response.ok) throw new Error(body.error || "Não foi possível enviar a solicitação.");
      setRequested(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  const price = plan.mensalidade === null ? "Preço a definir" : Number(plan.mensalidade).toLocaleString("pt-BR", {
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
        <div className={requested ? "is-done" : acknowledged ? "is-active" : ""}><i>{requested ? "✓" : "3"}</i><span>Solicitação</span></div>
      </section>

      <section className="plan-intent-contract">
        <h2>Como funciona a solicitação</h2>
        <p>O envio é gratuito. A assinatura só é ativada após a confirmação do pagamento.</p>

        <label className="plan-intent-ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={requested}
          />
          <span>
            Entendo que estou solicitando o plano e que nenhuma cobrança será feita agora.
          </span>
        </label>
      </section>

      <button
        type="button"
        className="plan-intent-submit"
        disabled={busy || requested || !acknowledged || plan.mensalidade === null}
        onClick={() => void registerIntent()}
      >
        {requested ? "Solicitação enviada" : busy ? "Enviando…" : "Solicitar plano"}
      </button>
      {plan.mensalidade === null && <p role="status">A contratação ficará disponível após a definição do preço.</p>}

      {requested && (
        <section className="plan-intent-success" role="status">
          <span>✓</span>
          <div>
            <strong>Solicitação enviada</strong>
            <p>Acompanhe o andamento em Minha assinatura.</p>
          </div>
          <Link href="/assinatura">Acompanhar →</Link>
        </section>
      )}

      {error && <p role="alert" className="plan-intent-error">{error}</p>}
    </div>
  );
}
