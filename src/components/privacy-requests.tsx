"use client";
import { useState } from "react";
export type PrivacyRequest = {id:number;protocolo:string;tipo:string;status:string;criadoEm:string;titularId:number;resposta?:string|null;respondidoEm?:string|null};
export default function PrivacyRequests({ initial }: { initial:PrivacyRequest[] }) {
 const [items,setItems]=useState(initial);
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function request() {
  setBusy(true);setError("");
  try {
   const response=await fetch("/api/privacy/requests",{method:"POST"});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Não foi possível registrar o pedido.");
   setItems(current=>[result,...current.filter(item=>item.id!==result.id)]);
   setConfirmed(false);
  }catch(cause){setError(cause instanceof Error?cause.message:"Falha de conexão.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-6"><section className="card-dark space-y-5 p-6"><h2 className="font-display text-2xl">Solicitar exclusão dos meus dados</h2><p className="text-sm leading-7 text-[#c6c2b9]">O pedido será analisado pela administração. Seus dados não são apagados imediatamente. Obrigações legais e preservação justificada de provas podem exigir retenção de parte dos registros, com resposta fundamentada.</p><label className="flex gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#d4af37]"/><span>Quero registrar um pedido de exclusão dos dados vinculados à minha conta.</span></label><button type="button" disabled={!confirmed||busy} onClick={request} className="btn-outline">{busy?"Registrando pedido…":"Registrar pedido de exclusão"}</button>{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</section><section aria-live="polite"><h2 className="font-display text-2xl">Meus protocolos</h2>{items.length===0?<p className="mt-4 text-sm text-[#b7b3a9]">Nenhum pedido registrado.</p>:<ul className="mt-4 space-y-3">{items.map(item=><li key={item.id} className="card-dark p-5"><p className="font-semibold text-[#e4ca91]">{item.protocolo}</p><p className="mt-2 text-sm">Exclusão de dados · {({SOLICITADA:"Pedido recebido",EM_ANALISE:"Em análise",AGUARDANDO_TITULAR:"Aguardando suas informações",RESPONDIDA:"Atendimento respondido"} as Record<string,string>)[item.status]||item.status}</p>{item.resposta && <p className="mt-3 whitespace-pre-wrap text-sm">{item.resposta}</p>}<p className="mt-2 text-xs text-[#b7b3a9]">{new Date(item.criadoEm+"Z").toLocaleString("pt-BR")}</p></li>)}</ul>}</section></div>;
}
