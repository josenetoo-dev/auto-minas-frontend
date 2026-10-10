"use client";
import { useState } from "react";
export default function ReportButton({carId,loggedIn}:{carId:number;loggedIn:boolean}){
 const [open,setOpen]=useState(false),[category,setCategory]=useState("POSSIVEL_FRAUDE"),[report,setReport]=useState("");
 const [error,setError]=useState(""),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false);
 if(!loggedIn)return <p className="text-xs text-[#8b8b96]">Para denunciar um anúncio, <a className="underline" href="/login">entre na sua conta</a>.</p>;
 async function send(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
  const response=await fetch("/api/backend/v1/denuncias",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({anuncioId:carId,categoria:category,relato:report})});
  const json=await response.json();if(!response.ok)throw new Error(json.detail||json.error||"Não foi possível registrar a denúncia");
  setSuccess(true);setOpen(false);
 }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}}
 return <div className="text-sm">{success?<p className="text-emerald-300">Denúncia registrada para análise humana.</p>:<><button className="text-[#a9a9b4] underline hover:text-red-300" onClick={()=>setOpen(v=>!v)}>Denunciar anúncio suspeito</button>{open&&<form onSubmit={send} className="mt-3 space-y-3 rounded-lg border border-red-500/20 bg-red-950/10 p-4"><label className="label-dark">Motivo</label><select className="input-dark" value={category} onChange={e=>setCategory(e.target.value)}><option value="POSSIVEL_FRAUDE">Possível fraude</option><option value="DOCUMENTO_SUSPEITO">Documento suspeito</option><option value="CONTEUDO_INADEQUADO">Conteúdo inadequado</option><option value="OUTRO">Outro</option></select><label className="label-dark">Relato (mínimo 10 caracteres)</label><textarea className="input-dark min-h-28" required minLength={10} maxLength={1000} value={report} onChange={e=>setReport(e.target.value)}/><button type="submit" disabled={busy} className="btn-outline">{busy?"Enviando…":"Registrar denúncia"}</button>{error&&<p role="alert" className="text-red-300">{error}</p>}</form>}</>}
 </div>;
}
