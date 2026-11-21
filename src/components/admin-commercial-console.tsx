"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommercialContract, CommercialPlan } from "@/lib/commercial";
import { paymentStatus, subscriptionStatus } from "@/lib/commercial-labels";

type ContractSummary = Pick<CommercialContract, "id" | "versao" | "titulo" | "publicado">;

type Subscription = { id: number; codigoPlano: string; nomePlano: string; mensalidade: number; comissaoPercentual: number; status: string; situacaoFinanceira: string; criadoEm: string; inicioVigencia: string | null; vencimentoEm: string | null; referenciaPagamentoExterno: string | null };
type Page<T> = { content: T[] };
const endpoints = { subscriptions: "/api/commercial/admin/subscriptions", contracts: "/api/commercial/admin/contracts" };

export default function AdminCommercialConsole({ plans: initialPlans }: { plans: CommercialPlan[] }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [benefits, setBenefits] = useState<Record<string, string>>(() => Object.fromEntries(initialPlans.map(plan => [plan.codigo, readBenefits(plan.beneficiosJson).join("\n")])));
  const [form, setForm] = useState({ versao: "", titulo: "", conteudo: "" });
  const [refs, setRefs] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [subscriptionResponse, contractResponse] = await Promise.all([fetch(endpoints.subscriptions), fetch(endpoints.contracts)]);
      const [subscriptionPage, contractPage] = await Promise.all([subscriptionResponse.json(), contractResponse.json()]) as [Page<Subscription>, Page<ContractSummary>];
      if (!subscriptionResponse.ok || !contractResponse.ok) throw new Error("Não foi possível carregar a administração comercial. Verifique o acesso administrativo.");
      setSubscriptions(subscriptionPage.content); setContracts(contractPage.content);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de conexão."); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function mutate(url: string, method: string, body?: unknown) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(url, { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || result.detail || "A operação não foi concluída.");
      setNotice("Alteração registrada."); await load();
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de conexão."); return false; }
    finally { setBusy(false); }
  }

  return <div className="space-y-8">
    <section className="card-dark space-y-4 p-5 sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Planos · configuração</p><h2 className="font-display mt-2 text-2xl font-bold">Benefícios configuráveis</h2><p className="mt-2 text-sm leading-6 text-[#a9a9b2]">Cadastre um benefício aprovado por linha.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{initialPlans.map(plan => <form key={plan.codigo} onSubmit={event => { event.preventDefault(); void mutate(`/api/commercial/admin/plans/${plan.codigo}/benefits`, "PUT", { beneficios: benefits[plan.codigo].split("\n").map(item => item.trim()).filter(Boolean) }); }} className="space-y-3 rounded-xl border border-white/[.08] p-4"><h3 className="font-semibold">{plan.nome}</h3><textarea aria-label={`Benefícios ${plan.nome}`} value={benefits[plan.codigo]} onChange={event => setBenefits(current => ({ ...current, [plan.codigo]: event.target.value }))} rows={4} maxLength={3000} className="input-dark resize-y" placeholder="Um benefício por linha; deixe vazio se ainda não definido."/><button disabled={busy} className="btn-outline min-h-10 w-full">Salvar benefícios</button></form>)}</div>
    </section>

    <section className="card-dark space-y-4 p-5 sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Assinaturas</p><h2 className="font-display mt-2 text-2xl font-bold">Solicitações e pagamentos</h2><p className="mt-2 text-sm leading-6 text-[#a9a9b2]">Confira o pagamento no canal de cobrança antes de confirmar a assinatura.</p></div>
      <div className="space-y-3">{subscriptions.map(item => <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/[.08] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.nomePlano} · R$ {Number(item.mensalidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</p><p className="mt-1 text-xs text-[#9b9ba4]">{subscriptionStatus(item.status)} · {paymentStatus(item.situacaoFinanceira)}</p><p className="mt-1 text-xs text-[#a5a5ad]">Vigência: {item.inicioVigencia ? new Date(item.inicioVigencia).toLocaleDateString("pt-BR") : "não iniciada"} — {item.vencimentoEm ? new Date(item.vencimentoEm).toLocaleDateString("pt-BR") : "sem vencimento"}</p></div>{["INTENCAO", "PENDENTE_PAGAMENTO_EXTERNO"].includes(item.status) && <div className="flex min-w-0 gap-2"><input aria-label={`Referência externa assinatura ${item.id}`} maxLength={160} value={refs[item.id] ?? ""} onChange={event => setRefs(current => ({ ...current, [item.id]: event.target.value }))} className="input-dark min-w-0" placeholder="Referência externa verificada"/><button disabled={busy || (refs[item.id] ?? "").trim().length < 4} onClick={() => { if (window.confirm("Confirma que a cobrança foi verificada fora do Auto Minas? Só prossiga com evidência real.")) void mutate(`/api/commercial/admin/subscriptions/${item.id}/confirm`, "POST", { referenciaExterna: refs[item.id] }); }} className="btn-gold shrink-0">Confirmar</button></div>}</article>)}</div>
      {subscriptions.length === 0 && <p className="text-sm text-[#9b9ba4]">Nenhuma intenção de contratação registrada.</p>}
    </section>

    <section className="card-dark space-y-4 p-5 sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Contratos</p><h2 className="font-display mt-2 text-2xl font-bold">Versões e publicação</h2><p className="mt-2 text-sm leading-6 text-[#a9a9b2]">Use o texto revisado e aprovado antes de publicar uma versão.</p></div>
      <div className="space-y-2">{contracts.map(contract => <article key={contract.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.08] p-4"><div><p className="font-semibold">{contract.versao} · {contract.titulo}{contract.publicado ? " · Vigente" : " · Arquivado ou em revisão"}</p></div>{!contract.publicado && <button disabled={busy} onClick={() => { if (window.confirm("Publicar esta versão e exigir novo aceite dos anunciantes?")) void mutate(`/api/commercial/admin/contracts/${contract.id}/publish`, "POST"); }} className="btn-outline">Publicar versão</button>}</article>)}</div>
      <form onSubmit={event => { event.preventDefault(); void mutate(endpoints.contracts, "POST", form).then((saved) => { if (saved) setForm({ versao: "", titulo: "", conteudo: "" }); }); }} className="grid gap-3 border-t border-white/[.08] pt-5"><h3 className="font-semibold">Criar rascunho de contrato</h3><div className="grid gap-3 sm:grid-cols-2"><input required maxLength={40} value={form.versao} onChange={event => setForm(current => ({ ...current, versao: event.target.value }))} className="input-dark" placeholder="Versão"/><input required maxLength={160} value={form.titulo} onChange={event => setForm(current => ({ ...current, titulo: event.target.value }))} className="input-dark" placeholder="Título"/></div><textarea required value={form.conteudo} onChange={event => setForm(current => ({ ...current, conteudo: event.target.value }))} rows={10} maxLength={100000} className="input-dark" placeholder="Conteúdo integral aprovado por jurídico e preenchido com dados reais da pessoa jurídica."/><button disabled={busy} className="btn-outline min-h-11 justify-self-start">Salvar como rascunho</button></form>
    </section>
    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}{error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}

function readBenefits(raw: string): string[] {
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
  catch { return []; }
}
