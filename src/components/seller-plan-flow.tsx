"use client";

import { useState } from "react";
import type { CommercialContract, CommercialPlan } from "@/lib/commercial";

type Props = { plan: CommercialPlan; contract: CommercialContract };
type Intent = { id: number; codigoPlano: string; nomePlano: string; mensalidade: number; status: string; situacaoFinanceira: string };

export default function SellerPlanFlow({ plan, contract }: Props) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function registerIntent() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/commercial/intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigoPlano: plan.codigo }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível registrar a intenção.");
      setIntent(body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de conexão."); }
    finally { setBusy(false); }
  }

  function simulateAcceptance() { if (acknowledged) setAccepted(true); }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section className="card-dark min-w-0 space-y-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#9999a2]">DEMO · versão {contract.versao}</p><h2 className="font-display mt-2 text-xl font-bold">{contract.titulo}</h2></div><span className="rounded-full border border-amber-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">DEMO · pendente de revisão jurídica</span></div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[.08] bg-black/25 p-4 font-sans text-sm leading-6 text-[#c5c5ce]">{contract.conteudo}</pre>
      <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4 text-sm leading-6 text-amber-100"><strong>Somente demonstração.</strong> Este texto não é contrato juridicamente válido, não está publicado e está pendente de revisão jurídica. O aceite de teste abaixo fica somente nesta tela: o backend exige versão publicada e não receberá um aceite fictício.</div>
      <label className="flex items-start gap-3 text-sm leading-6 text-[#c5c5ce]"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} disabled={accepted} className="mt-1 accent-[#d4af37]" />Confirmo que li a minuta apenas para fins de teste e entendo que isso não é aceite contratual nem ativa assinatura.</label>
      <button type="button" onClick={simulateAcceptance} disabled={!acknowledged || accepted} className="btn-outline min-h-11 w-full sm:w-auto">{accepted ? "Confirmação de teste concluída" : "Confirmar aceite demonstrativo (local)"}</button>
    </section>
    <aside className="card-dark h-fit space-y-5 p-5 sm:p-6 lg:sticky lg:top-24">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-[#9999a2]">Plano selecionado</p><h2 className="font-display mt-2 text-2xl font-bold text-[#f4f3ee]">{plan.nome}</h2></div>
      <div className="border-y border-white/[.08] py-4"><p className="font-display text-3xl font-bold">R$ {Number(plan.mensalidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}<span className="ml-1 text-sm font-medium text-[#92929d]">/ mês</span></p><p className="mt-2 text-sm text-[#b9b9c1]">Comissão: {Number(plan.comissaoPercentual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</p></div>
      <p className="text-sm leading-6 text-[#a9a9b2]">A mensalidade será cobrada externamente quando o processo estiver disponível. Pagamento ainda não habilitado.</p>
      <button type="button" onClick={registerIntent} disabled={busy || !!intent || !accepted} className="btn-gold min-h-12 w-full">{intent ? "Intenção registrada" : busy ? "Registrando…" : accepted ? "Registrar intenção demonstrativa" : "Confirme a etapa demonstrativa acima"}</button>
      {intent && <div role="status" className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4 text-sm leading-6 text-amber-100">Intenção registrada ({intent.status}). A assinatura permanece não paga e inativa; nenhum cartão ou pagamento foi processado.</div>}
      {accepted && <p role="status" className="text-xs text-emerald-200">Confirmação demonstrativa concluída nesta tela. Nenhum aceite foi persistido e nenhuma assinatura foi ativada.</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </aside>
  </div>;
}
