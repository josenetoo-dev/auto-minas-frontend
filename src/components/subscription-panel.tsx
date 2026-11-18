"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommercialSubscription } from "@/lib/commercial";

const statusNames: Record<string, string> = {
  INTENCAO: "Intenção registrada",
  PENDENTE_PAGAMENTO_EXTERNO: "Aguardando confirmação externa",
  ATIVA: "Ativa",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

function formatMoney(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : null;
}

export default function SubscriptionPanel({ initial }: { initial: CommercialSubscription[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const current = useMemo(
    () => items.find((item) => item.status === "ATIVA") ?? items.find((item) => ["INTENCAO", "PENDENTE_PAGAMENTO_EXTERNO"].includes(item.status)) ?? null,
    [items],
  );

  async function cancel(id: number) {
    if (!window.confirm("Deseja encerrar esta assinatura ou intenção? A vigência já concedida será preservada quando aplicável.")) return;

    setBusy(id);
    setError("");

    try {
      const response = await fetch(`/api/commercial/subscriptions/${id}/cancel`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível cancelar.");

      setItems((currentItems) => currentItems.map((item) => item.id === id ? result : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha de conexão.");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <section className="subscription-empty">
        <span aria-hidden="true">♛</span>
        <h2>Nenhuma assinatura registrada</h2>
        <p>Escolha um plano para registrar sua intenção comercial.</p>
        <Link href="/planos">Ver planos</Link>
      </section>
    );
  }

  return (
    <div className="subscription-reference-panel">
      {current && (
        <section className="subscription-current-card">
          <div className="subscription-current-icon" aria-hidden="true">♛</div>
          <div>
            <small>{current.status === "ATIVA" ? "Plano atual" : "Contratação em andamento"}</small>
            <h2>{current.nomePlano}</h2>
            <span className={current.status === "ATIVA" ? "is-active" : "is-pending"}>
              {statusNames[current.status] ?? current.status}
            </span>
            <p>
              {current.status === "ATIVA" && current.vencimentoEm
                ? `Vigência até ${formatDate(current.vencimentoEm)}.`
                : current.status === "ATIVA"
                  ? "Assinatura ativa."
                  : "Aguardando conclusão do processo comercial."}
            </p>
          </div>
        </section>
      )}

      <nav className="subscription-reference-actions" aria-label="Gerenciar assinatura">
        <Link href="/planos">
          <span>▤</span>
          <div><strong>Detalhes e planos</strong><small>Veja benefícios e opções disponíveis</small></div>
          <b>›</b>
        </Link>

        <Link href="/planos">
          <span>↻</span>
          <div><strong>Alterar plano</strong><small>Escolha outra opção comercial</small></div>
          <b>›</b>
        </Link>

        {current && ["INTENCAO", "PENDENTE_PAGAMENTO_EXTERNO", "ATIVA"].includes(current.status) && !current.renovacaoCancelada && (
          <button type="button" disabled={busy !== null} onClick={() => void cancel(current.id)}>
            <span>⊗</span>
            <div>
              <strong>{current.status === "ATIVA" ? "Cancelar renovação" : "Encerrar intenção"}</strong>
              <small>{current.status === "ATIVA" ? "Preserva a vigência já concedida" : "Interrompe a contratação pendente"}</small>
            </div>
            <b>›</b>
          </button>
        )}
      </nav>

      <section className="subscription-history">
        <div className="subscription-history-heading">
          <h2>Histórico comercial</h2>
          <p>Registros reais de intenção, vigência e situação financeira.</p>
        </div>

        <div className="subscription-history-list">
          {items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.nomePlano}</strong>
                <span>{statusNames[item.status] ?? item.status}</span>
              </div>
              <p>
                {formatMoney(item.mensalidade)}
                {item.periodicidade === "MENSAL" ? "/mês" : " · contratação única"}
              </p>
              <small>
                Criada em {formatDate(item.criadoEm) ?? "—"}
                {item.inicioVigencia ? ` · início ${formatDate(item.inicioVigencia)}` : ""}
                {item.vencimentoEm ? ` · fim ${formatDate(item.vencimentoEm)}` : ""}
              </small>
              <em>Situação financeira: {item.situacaoFinanceira}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="subscription-reference-warning">
        <strong>Pagamentos e faturas ainda não estão disponíveis.</strong>
        <p>Esta área não simula cartão, cobrança, fatura ou comprovante. Esses recursos entram apenas quando o fluxo financeiro real estiver implementado.</p>
      </section>

      {error && <p role="alert" className="subscription-reference-error">{error}</p>}
    </div>
  );
}
