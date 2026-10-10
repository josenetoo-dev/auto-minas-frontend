"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function EmailActivation(){const router=useRouter();const [code,setCode]=useState(""),[busy,setBusy]=useState(false),[text,setText]=useState(""),[error,setError]=useState("");
 async function call(path:string,body?:unknown){setBusy(true);setError("");setText("");try{
  const res=await fetch(`/api/backend/v1/usuario/me/contato/email/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  const json=res.status===204?{}:await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(json.detail||json.error||"Não foi possível concluir a solicitação.");
  if(path==="confirmar"){setText("E-mail confirmado. Entre novamente para continuar.");await fetch("/api/auth/logout",{method:"POST"});router.push("/login?registered=1");router.refresh();}
  else setText("Código enviado, quando o envio SMTP estiver configurado. Consulte sua caixa postal.");
 }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}}
 return <div className="card-dark space-y-4 border border-amber-500/20 p-6"><h2 className="font-display text-2xl font-bold">Confirme seu e-mail</h2><p className="text-sm text-[#9b9ba4]">Sua conta precisa de um e-mail confirmado para solicitar revisões e anunciar veículos.</p><button onClick={()=>call("solicitar")} disabled={busy} className="btn-outline">Enviar código por e-mail</button><div className="flex flex-col gap-2 sm:flex-row"><input className="input-dark flex-1" placeholder="Código recebido" aria-label="Código de ativação" value={code} onChange={e=>setCode(e.target.value)}/><button disabled={busy||!code.trim()} onClick={()=>call("confirmar",{token:code})} className="btn-gold">Confirmar</button></div>{text&&<p className="text-sm text-emerald-300">{text}</p>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>;
}
