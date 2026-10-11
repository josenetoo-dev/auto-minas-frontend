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
 return <div className="flex w-full min-w-0 flex-col gap-2"><div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
  {!(["vendido","suspenso","arquivado"].includes(status))&&<Link href={`/vender/editar/${carId}`} className="btn-outline min-h-11 px-2 py-2 text-center text-xs sm:px-4 sm:text-sm">Editar anúncio</Link>}
  {status==="ativo"&&<button type="button" disabled={busy} onClick={()=>transition("pausado")} className="min-h-11 rounded-lg border border-amber-500/30 px-2 py-2 text-xs text-amber-200 sm:px-4 sm:text-sm">Pausar</button>}
  {status==="pausado"&&<button type="button" disabled={busy} onClick={()=>transition("pendente")} className="btn-outline min-h-11 px-2 py-2 text-center text-xs sm:px-4 sm:text-sm">Solicitar reativação</button>}
  {["ativo","pausado"].includes(status)&&<button type="button" disabled={busy} onClick={()=>transition("vendido")} className="min-h-11 rounded-lg border border-[#d4af37]/40 px-2 py-2 text-xs text-[#e9cd7c] sm:px-4 sm:text-sm">Marcar vendido</button>}
  {status!=="arquivado"&&<button className="min-h-11 rounded-lg border border-red-500/30 px-2 py-2 text-xs text-red-300 sm:px-4 sm:text-sm" onClick={archive} disabled={busy}>{busy?"Arquivando…":"Arquivar anúncio"}</button>}
 </div><p className="max-w-md text-xs text-[#8d8d99]">Anúncios editados e reativados voltam para revisão humana. Anúncios vendidos não podem ser reativados.</p>
 {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>;
}
