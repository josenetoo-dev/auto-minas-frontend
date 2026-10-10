"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
/** A API atual permite editar e arquivar, mas NÃO fornece transição de status pelo vendedor. */
export default function CarOwnerActions({carId,status}:{carId:number;status:string}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
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
  {status!=="arquivado"&&<button className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300" onClick={archive} disabled={busy}>{busy?"Arquivando…":"Arquivar anúncio"}</button>}
 </div><p className="max-w-md text-xs text-[#8d8d99]">Anúncios editados voltam para revisão. Alterações de status de venda/pausa dependem de endpoints específicos do backend.</p>
 {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>;
}
