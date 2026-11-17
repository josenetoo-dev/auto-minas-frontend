"use client";

import {useState,type FormEvent} from "react";
import type {PrivacyRequest} from "@/components/privacy-requests";

export default function PrivacyAdmin({initial}:{initial:PrivacyRequest[]}) {
 const [items,setItems]=useState(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [history,setHistory]=useState<Record<number,string>>({});
 async function respond(event:FormEvent<HTMLFormElement>,id:number) {
  event.preventDefault();setBusy(true);setMessage("");
  const form=new FormData(event.currentTarget);
  try {
   const response=await fetch(`/api/backend/v1/privacidade/solicitacoes/admin/${id}`,{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status:form.get("status"),resposta:form.get("resposta")}),
   });
   const data=await response.json();
   if(!response.ok)throw new Error(data.detail||data.error||"Não foi possível registrar o atendimento.");
   setItems(old=>old.map(item=>item.id===id?data:item));
   setMessage("Atendimento registrado. A resposta está disponível na conta do titular.");
  }catch(error){setMessage(error instanceof Error?error.message:"Falha de conexão.");}
  finally{setBusy(false);}
 }
 async function showHistory(id:number) {
  try {
   const response=await fetch(`/api/backend/v1/privacidade/solicitacoes/admin/${id}/historico`,{cache:"no-store"});
   if(!response.ok)throw new Error("Não foi possível carregar o histórico.");
   const data=await response.json();
   setHistory(old=>({...old,[id]:data.historico||"Nenhum atendimento registrado."}));
  }catch(error){setMessage(error instanceof Error?error.message:"Falha de conexão.");}
 }
 return <div className="space-y-4">
  <p role="status" className="text-sm text-[#e4ca91]">{message}</p>
  {!items.length&&<p>Nenhum pedido recebido.</p>}
  {items.map(item=><section key={item.id} className="card-dark space-y-3 p-4 sm:p-6">
   <h2 className="font-semibold">{item.protocolo}</h2><p className="text-sm">{item.status}</p>
   {item.resposta&&<p className="whitespace-pre-wrap text-sm">{item.resposta}</p>}
   {item.status!=="RESPONDIDA"&&<form className="space-y-3" onSubmit={event=>void respond(event,item.id)}>
    <label className="block text-sm">Etapa do atendimento<select name="status" className="input-dark mt-1" required>
     <option value="EM_ANALISE">Em análise</option><option value="AGUARDANDO_TITULAR">Aguardando informações do titular</option><option value="RESPONDIDA">Respondida</option>
    </select></label>
    <label className="block text-sm">Resposta visível ao titular<textarea name="resposta" className="input-dark mt-1 min-h-28" required minLength={10} maxLength={2000} placeholder="Explique as providências realizadas, eventuais retenções justificadas e o próximo passo." /></label>
    <p className="text-xs text-[#b7b3a9]">Registre somente providências efetivamente executadas. Responder um pedido não elimina dados automaticamente.</p>
    <button disabled={busy} className="btn-outline">Registrar atendimento</button>
   </form>}
   <button type="button" className="min-h-11 text-sm underline" onClick={()=>void showHistory(item.id)}>Ver histórico do atendimento</button>
   {history[item.id]&&<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">{history[item.id]}</pre>}
  </section>)}
 </div>;
}
