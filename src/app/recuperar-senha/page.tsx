"use client";
import { useState } from "react";
import Link from "next/link";
export default function ResetPassword(){
 const [email,setEmail]=useState(""),[token,setToken]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[phase,setPhase]=useState(0),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
  const response=await fetch(`/api/backend/auth/password-reset/${phase===0?"request":"confirm"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(phase===0?{email}:{email,token,newPassword:password})});
  const json=response.status===204||response.status===202?{}:await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(json.detail||json.error||"Não foi possível concluir. Tente novamente.");
  if(phase===0){setPhase(1);setMessage("Se o e-mail estiver cadastrado e o serviço ativo, receberá um código. Confira também a pasta de spam.");}
  else{setPhase(2);setMessage("Senha atualizada. Faça login novamente.");}
 }catch(e){setError(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}}
 return <div className="mx-auto max-w-lg px-4 py-16"><div className="card-dark space-y-5 p-7"><h1 className="font-display text-3xl font-bold">Recuperar <span className="gold-text">senha</span></h1>{phase<2&&<form onSubmit={submit} className="space-y-4"><label className="label-dark" htmlFor="email">E-mail da conta</label><input id="email" type="email" className="input-dark" required value={email} onChange={e=>setEmail(e.target.value)}/>{phase===1&&<><label className="label-dark" htmlFor="token">Código enviado</label><input id="token" className="input-dark" required value={token} onChange={e=>setToken(e.target.value)}/><label className="label-dark" htmlFor="newpass">Nova senha segura</label><input id="newpass" type="password" minLength={8} className="input-dark" required value={password} onChange={e=>setPassword(e.target.value)}/></>}<button disabled={busy} className="btn-gold w-full">{busy?"Aguarde…":phase===0?"Solicitar código":"Redefinir senha"}</button></form>}{error&&<p role="alert" className="text-red-300">{error}</p>}{message&&<p className="text-sm text-emerald-300">{message}</p>}<Link href="/login" className="text-sm text-[#d4af37] underline">Voltar ao login</Link></div></div>
}
