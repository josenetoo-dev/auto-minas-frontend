"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

/** A API Spring abre conversas somente vinculadas a propostas comerciais. */
export default function ChatCta({carId,price,loggedIn,nextPath}:{carId:number;price:number;loggedIn:boolean;nextPath:string}) {
 const router=useRouter();const [value,setValue]=useState(String(price));
 const [message,setMessage]=useState("Tenho interesse no veículo e gostaria de negociar.");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 if(!loggedIn)return <a href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn-gold w-full py-3">Entrar para enviar proposta</a>;
 async function send(){setBusy(true);setError("");try{
  const res=await fetch("/api/conversations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({carId,price:Number(value),message})});
  const json=await res.json();if(!res.ok)throw new Error(json.error||"Não foi possível enviar proposta");
  router.push(`/chat/${json.id}`);router.refresh();
 }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}}
 return <div className="space-y-3"><p className="text-sm text-[#9b9ba4]">Para abrir uma negociação, envie uma proposta de valor ao vendedor. Preço anunciado: <strong className="text-[#f2d87e]">{formatPrice(price)}</strong>.</p>
  <label htmlFor="offerValue" className="label-dark">Valor que deseja propor (R$)</label>
  <input id="offerValue" type="number" min="1" required value={value} onChange={e=>setValue(e.target.value)} className="input-dark"/>
  <label htmlFor="offerMessage" className="label-dark">Mensagem inicial</label>
  <textarea id="offerMessage" required maxLength={255} className="input-dark min-h-20" value={message} onChange={e=>setMessage(e.target.value)}/>
  <button type="button" onClick={send} disabled={busy||Number(value)<=0||!message.trim()} className="btn-gold w-full py-3">{busy?"Enviando…":"Enviar proposta e abrir negociação"}</button>
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
 </div>;
}
