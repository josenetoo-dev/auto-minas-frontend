"use client";

import { useState } from "react";
import { verificationCategories, verificationStatus } from "@/lib/verification";

type Item={id:number;tipo:string;status:string;motivoRejeicao?:string|null};
type Event={responsavel:string;resultado:string;categoria:string|null;justificativa:string|null;ocorridoEm:string};

async function request(path:string,body?:unknown) {
 const response=await fetch(`/api/backend/v1/verificacoes/${path}`,{
  method:body===undefined?"GET":"POST",cache:"no-store",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body),
 });
 const data=response.status===204?{}:await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.detail||data.error||"Não foi possível registrar a decisão. Tente novamente.");
 return data;
}

export default function VerificationReview({item,role,canApprove=true,onUpdated}:{
 item:Item;role:"ADMIN"|"REVIEWER";canApprove?:boolean;onUpdated:()=>Promise<void>;
}) {
 const [reason,setReason]=useState("");
 const [category,setCategory]=useState("DOCUMENTO_ILEGIVEL");
 const [history,setHistory]=useState<Event[]|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const pending=["EM_ANALISE","INCONCLUSIVA"].includes(item.status);
 async function act(action:string) {
  setBusy(true);setError("");setMessage("");
  try {
   const payload=action==="aprovar"?{}:action==="rejeitar"?{motivo:reason,categoria:category}: {
    motivo:reason,categoria:action==="expirar"?"REVALIDACAO_NECESSARIA":category,
   };
   await request(`revisao/${item.id}/${action}`,payload);
   await onUpdated();setHistory(null);setReason("");setMessage("Decisão registrada no histórico.");
  } catch(cause){setError(cause instanceof Error?cause.message:"Falha de conexão.");}
  finally{setBusy(false);}
 }
 return <div className="mt-3 space-y-3">
  <p className="text-sm text-[#b7b3a9]">{verificationStatus[item.status]||"Análise pendente"}</p>
  {item.motivoRejeicao&&<p className="break-words text-sm text-amber-200">{item.motivoRejeicao}</p>}
  {(pending||(role==="ADMIN"&&item.status==="APROVADA"))&&<>
   <label className="block text-sm">Justificativa para correção ou reavaliação
    <textarea value={reason} onChange={event=>setReason(event.target.value)} maxLength={500}
     className="input-dark mt-2 min-h-20" placeholder="Indique o que precisa ser corrigido, sem copiar dados pessoais."/>
   </label>
   {pending&&<label className="block text-sm">Tipo de pendência
    <select className="input-dark mt-2" value={category} onChange={event=>setCategory(event.target.value)}>
     {Object.entries(verificationCategories).filter(([value])=>role==="ADMIN"||value!=="FRAUDE_CONFIRMADA").map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
   </label>}
   <div className="flex flex-wrap gap-2">
    {pending&&<>
     <button type="button" disabled={busy||!canApprove} className="btn-outline min-h-11" onClick={()=>act("aprovar")}>{item.tipo==="IDENTIDADE"?"Aprovar identidade após conferir":"Aprovar documento do veículo após conferir"}</button>
     <button type="button" disabled={busy||reason.trim().length<10||category==="FALHA_TECNICA"} className="btn-outline min-h-11" onClick={()=>act("rejeitar")}>Rejeitar documento</button>
     {role==="ADMIN"&&<>
      <button type="button" disabled={busy||reason.trim().length<10||category==="FRAUDE_CONFIRMADA"} className="btn-outline min-h-11" onClick={()=>act("corrigir")}>Solicitar correção</button>
      <button type="button" disabled={busy||reason.trim().length<10||category==="FRAUDE_CONFIRMADA"} className="btn-outline min-h-11" onClick={()=>act("inconclusiva")}>Manter em análise manual</button>
     </>}
    </>}
    {role==="ADMIN"&&item.status==="APROVADA"&&<button type="button" disabled={busy||reason.trim().length<10} className="btn-outline min-h-11" onClick={()=>act("expirar")}>Exigir revalidação documental</button>}
   </div>
   {role==="ADMIN"&&item.status==="APROVADA"&&<p className="text-xs text-[#b7b3a9]">A revalidação retira os anúncios afetados da vitrine até nova aprovação.</p>}
  </>}
  {category==="FALHA_TECNICA"&&<p className="text-xs text-[#b7b3a9]">Falha técnica exige análise manual; não é prova de fraude.</p>}
  <button type="button" disabled={busy} className="min-h-11 text-left text-sm text-[#e4ca91] underline" onClick={async()=>{
   setBusy(true);setError("");
   try {const data=await request(`revisao/${item.id}/historico?page=0&size=50`);setHistory(data.content);}
   catch(cause){setError(cause instanceof Error?cause.message:"Falha de conexão.");}
   finally{setBusy(false);}
  }}>Consultar histórico de decisões</button>
  {history&&<ol aria-label="Histórico de decisões" className="space-y-3 border-l border-white/15 pl-3">
   {history.length===0?<li className="text-sm text-[#b7b3a9]">Nenhuma decisão registrada.</li>:history.map((event,index)=><li key={index} className="break-words text-sm">
    <p className="font-semibold">{verificationStatus[event.resultado]||"Decisão registrada"}</p>
    <p className="text-xs text-[#b7b3a9]">{event.responsavel} · {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(event.ocorridoEm+"Z"))}</p>
    {event.categoria&&<p className="text-xs text-[#b7b3a9]">{verificationCategories[event.categoria]||"Análise administrativa"}</p>}
    {event.justificativa&&<p className="mt-1">{event.justificativa}</p>}
   </li>)}
  </ol>}
  {message&&<p role="status" className="text-sm text-emerald-300">{message}</p>}
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
 </div>;
}
