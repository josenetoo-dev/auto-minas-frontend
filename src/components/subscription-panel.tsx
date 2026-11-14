"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommercialSubscription } from "@/lib/commercial";
const statusNames: Record<string,string> = { INTENCAO: "Intenção registrada", PENDENTE_PAGAMENTO_EXTERNO: "Aguardando confirmação externa", ATIVA: "Ativa", CANCELADA: "Cancelada", EXPIRADA: "Expirada" };

export default function SubscriptionPanel({ initial }: { initial: CommercialSubscription[] }) {
  const [items, setItems] = useState(initial); const [busy, setBusy] = useState<number|null>(null); const [error, setError] = useState("");
  async function cancel(id:number) {
    if (!window.confirm("Cancelar esta assinatura agora? A alteração será registrada no histórico.")) return;
    setBusy(id);setError("");
    try {
      const response=await fetch(`/api/commercial/subscriptions/${id}/cancel`,{method:"POST"});const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Não foi possível cancelar a assinatura.");
      setItems(current=>current.map(item=>item.id===id?result:item));
    } catch(cause) { setError(cause instanceof Error?cause.message:"Falha de conexão."); }
    finally { setBusy(null); }
  }
  return <div className="space-y-4">{items.length===0?<section className="card-dark space-y-4 p-6"><p className="text-sm text-[#a9a9b2]">Você ainda não tem intenções ou assinaturas registradas.</p><Link href="/planos" className="btn-gold inline-flex min-h-11 items-center px-5">Ver planos</Link></section>:items.map(item=><article key={item.id} className="card-dark flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-xl font-bold">{item.nomePlano}</p><p className="mt-1 text-sm text-[#c3c3cc]">R$ {Number(item.mensalidade).toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês · comissão {Number(item.comissaoPercentual).toLocaleString("pt-BR",{minimumFractionDigits:2})}%</p><p className="mt-2 text-xs text-[#9b9ba4]">{statusNames[item.status]??item.status} · situação financeira: {item.situacaoFinanceira}</p><p className="mt-1 text-xs text-[#777782]">Vigência {item.inicioVigencia?new Date(item.inicioVigencia).toLocaleDateString("pt-BR"):"não iniciada"} — {item.vencimentoEm?new Date(item.vencimentoEm).toLocaleDateString("pt-BR"):"sem vencimento"}</p></div>{["INTENCAO","PENDENTE_PAGAMENTO_EXTERNO","ATIVA"].includes(item.status)&&<button disabled={busy!==null} onClick={()=>void cancel(item.id)} className="min-h-11 rounded-xl border border-red-500/30 px-4 text-sm text-red-200 disabled:opacity-50">{busy===item.id?"Cancelando…":"Cancelar assinatura"}</button>}</article>)}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>;
}
