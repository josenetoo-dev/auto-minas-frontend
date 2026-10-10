"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
/** Somente transições controladas pelo backend são exibidas; sem status fingido. */
export default function CarOwnerActions({carId,status}:{carId:number;status:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function transition(target:"pausado"|"pendente"|"vendido"){
  const notices={
   pausado:"Pausar o anúncio? Ele sairá da vitrine e deixará de receber novas propostas.",
   pendente:"Solicitar reativação? O anúncio ficará em análise até a moderação aprovar novamente.",
   vendido:"Marcar como vendido? Essa ação é definitiva e impede novas propostas."
  };
  if(!window.confirm(notices[target]))return;
  setBusy(true);setError("");
  try{
   const r=await fetch(`/api/cars/${carId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:target})});
   const response=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(response.error||"Não foi possível atualizar o anúncio.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}
  finally{setBusy(false);}
 }
 async function archive(){
  if(!window.confirm("Arquivar este anúncio? Ele deixará de aparecer publicamente, mas o histórico de propostas será preservado."))return;
  setBusy(true);setError("");try{
   const r=await fetch(`/api/cars/${carId}`,{method:"DELETE"});
   if(!r.ok){const data=await r.json().catch(()=>({}));throw new Error(data.error||"Não foi possível arquivar.");}
   router.push("/meus-anuncios");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}
 }
 return <div className="flex flex-col gap-2"><div className="flex flex-wrap gap-2">
  {!(["vendido","suspenso","arquivado"].includes(status))&&<Link href={`/vender/editar/${carId}`} className="btn-outline px-4 py-2 text-sm">Editar anúncio</Link>}
  {status==="ativo"&&<button type="button" disabled={busy} onClick={()=>transition("pausado")} className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-200">Pausar</button>}
  {status==="pausado"&&<button type="button" disabled={busy} onClick={()=>transition("pendente")} className="btn-outline px-4 py-2 text-sm">Solicitar reativação</button>}
  {["ativo","pausado"].includes(status)&&<button type="button" disabled={busy} onClick={()=>transition("vendido")} className="rounded-lg border border-[#d4af37]/40 px-4 py-2 text-sm text-[#e9cd7c]">Marcar vendido</button>}
  {status!=="arquivado"&&<button className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300" onClick={archive} disabled={busy}>{busy?"Arquivando…":"Arquivar anúncio"}</button>}
 </div><p className="max-w-md text-xs text-[#8d8d99]">Anúncios editados e reativados voltam para revisão humana. Anúncios vendidos não podem ser reativados.</p>
 {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>;
}
