"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Case={id:number;tipo:"IDENTIDADE"|"VEICULO";status:"RASCUNHO"|"EM_ANALISE"|"APROVADA"|"REJEITADA";veiculoId:number|null;motivoRejeicao:string|null;enviadoEm:string|null;revisadoEm:string|null};
type Evidence={id:number;tipo:string;tipoMidia:string;tamanho:number;criadoEm:string};
type BiometricSession={sessionId:string;status:string;criadoEm:string;finalizadoEm:string|null};
const names:Record<string,string>={IDENTIDADE_FRENTE:"Frente do documento",IDENTIDADE_VERSO:"Verso do documento",DOCUMENTO_VEICULO:"Documento do veículo"};
const statuses:Record<string,string>={RASCUNHO:"Aguardando envio",EM_ANALISE:"Análise em andamento",APROVADA:"Aprovada por revisor",REJEITADA:"Rejeitada"};
async function call<T>(path:string,method="GET",body?:BodyInit):Promise<T>{
 const res=await fetch(`/api/backend${path}`,{method,body,headers:typeof body==="string"?{"Content-Type":"application/json"}:undefined,cache:"no-store"});
 if(!res.ok){const j=await res.json().catch(()=>({}));throw new Error(j.detail||j.error||`Falha (${res.status})`);}return res.status===204?undefined as T:res.json();
}
export default function VerificationsDashboard(){
 const [cases,setCases]=useState<Case[]>([]),[docs,setDocs]=useState<Record<number,Evidence[]>>({}),[busy,setBusy]=useState(false),[err,setErr]=useState(""),[ok,setOk]=useState("");
 const [vehicleId,setVehicleId]=useState(""),[biometricId,setBiometricId]=useState<Record<number,BiometricSession>>({});
 async function reload(){const page=await call<{content:Case[]}>("/v1/verificacoes/minhas?page=0&size=100");setCases(page.content);
  const entries=await Promise.all(page.content.map(async c=>[c.id,await call<Evidence[]>(`/v1/verificacoes/${c.id}/evidencias`).catch(()=>[])] as const));
  setDocs(Object.fromEntries(entries));}
 useEffect(()=>{const timer=window.setTimeout(()=>{void reload().catch(e=>setErr(e instanceof Error?e.message:"Falha de conexão"));},0);return()=>window.clearTimeout(timer);},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>{const id=new URLSearchParams(window.location.search).get("veiculo");if(id&&/^\d+$/.test(id))setVehicleId(id);},0);return()=>window.clearTimeout(timer);},[]);
 async function act(path:string,method="POST",body?:BodyInit){setBusy(true);setErr("");setOk("");try{await call(path,method,body);await reload();setOk("Solicitação registrada.");}catch(e){setErr(e instanceof Error?e.message:"Falha de conexão");}finally{setBusy(false);}}
 async function upload(id:number,kind:string,file?:File){if(!file)return;if(!["image/jpeg","image/png"].includes(file.type)||file.size>5*1024*1024){setErr("Documento precisa ser JPG ou PNG com até 5 MB.");return;}
  const form=new FormData();form.append("arquivo",file);form.append("tipo",kind);await act(`/v1/verificacoes/${id}/evidencias`,"POST",form);}
 async function filePreview(id:number,doc:Evidence){setErr("");try{const res=await fetch(`/api/backend/v1/verificacoes/${id}/evidencias/${doc.id}/arquivo`,{cache:"no-store"});if(!res.ok)throw new Error("Não foi possível acessar o documento.");const url=URL.createObjectURL(await res.blob());const link=document.createElement("a");link.href=url;link.download=`documento-${doc.id}.${doc.tipoMidia.includes("png")?"png":"jpg"}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}catch(e){setErr(e instanceof Error?e.message:"Falha de acesso");}}
 async function startBiometry(id:number){setBusy(true);setErr("");try{const data=await call<BiometricSession>(`/v1/verificacoes/${id}/biometria/sessoes`,"POST",JSON.stringify({aceiteBiometria:true}));setBiometricId(p=>({...p,[id]:data}));setOk("Sessão criada. A captura facial exige a integração segura da câmera AWS, ainda não habilitada neste site. Não prossiga com documentos reais.");}catch(e){setErr(e instanceof Error?e.message:"Biometria indisponível");}finally{setBusy(false);}}
 return <div className="space-y-6"><div className="card-dark flex min-w-0 flex-col items-stretch justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5"><div><h2 className="font-display text-xl font-bold">Solicitações</h2><p className="mt-1 text-sm text-[#9b9ba4]">Inicie uma análise e envie os arquivos exigidos.</p></div><button disabled={busy} className="btn-gold" onClick={()=>act("/v1/verificacoes/identidade")}>+ Verificar identidade</button></div>
  <div className="card-dark min-w-0 space-y-3 p-4 sm:p-5"><h2 className="font-display text-xl font-bold">Verificar veículo cadastrado</h2><label htmlFor="vehicleId" className="label-dark">ID do veículo (disponível em Meus anúncios)</label><div className="flex min-w-0 flex-col gap-2 min-[400px]:flex-row"><input id="vehicleId" type="number" min="1" className="input-dark min-w-0 flex-1" value={vehicleId} onChange={e=>setVehicleId(e.target.value)} placeholder="Ex.: 42"/><button disabled={busy||!/^\d+$/.test(vehicleId)} className="btn-outline min-h-11 w-full min-[400px]:w-auto" onClick={()=>act(`/v1/verificacoes/veiculos/${vehicleId}`)}>Iniciar</button></div><p className="text-xs text-[#9b9ba4]">A verificação de veículo só pode ser enviada após a identidade ser aprovada.</p></div>
  {err&&<p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-red-200">{err}</p>}{ok&&<p role="status" className="text-emerald-300">{ok}</p>}
  {cases.map(c=><section key={c.id} className="card-dark min-w-0 space-y-4 p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-display text-xl font-bold">{c.tipo==="IDENTIDADE"?"Identidade":`Veículo #${c.veiculoId}`} • solicitação #{c.id}</h3><span className="rounded-lg border border-[#d4af37]/30 px-3 py-1 text-xs text-[#f2d87e]">{statuses[c.status]||c.status}</span></div>
   {c.motivoRejeicao&&<p className="rounded bg-red-950/20 p-3 text-sm text-red-200">Motivo: {c.motivoRejeicao}</p>}
   <div className="grid min-w-0 gap-4 sm:grid-cols-2">{(c.tipo==="IDENTIDADE"?["IDENTIDADE_FRENTE","IDENTIDADE_VERSO"]:["DOCUMENTO_VEICULO"]).map(kind=>{
    const existing=docs[c.id]?.find(d=>d.tipo===kind);const editable=c.status==="RASCUNHO"||c.status==="REJEITADA";
    return <div key={kind} className="rounded-lg border border-[#2d2d35] p-4"><p className="mb-2 font-semibold">{names[kind]}</p>{existing?<><p className="text-xs text-emerald-300">Arquivo enviado ({Math.round(existing.tamanho/1024)} KB)</p><button className="mt-2 inline-flex min-h-11 items-center text-sm text-[#d4af37] underline" onClick={()=>filePreview(c.id,existing)}>Baixar arquivo privado</button>{editable&&<button className="ml-3 inline-flex min-h-11 items-center text-sm text-red-300 underline" disabled={busy} onClick={()=>act(`/v1/verificacoes/${c.id}/evidencias/${existing.id}`,"DELETE")}>Excluir</button>}</>:editable?<input type="file" accept="image/jpeg,image/png" className="w-full text-sm" disabled={busy} onChange={e=>{void upload(c.id,kind,e.target.files?.[0]);e.target.value="";}}/>:<p className="text-xs text-[#9b9ba4]">Arquivo ausente</p>}</div>;
   })}</div>
   {c.tipo==="IDENTIDADE"&&c.status!=="APROVADA"&&<div className="rounded-lg bg-[#15151c] p-4"><p className="font-semibold text-[#f2d87e]">Prova de vida / biometria facial</p><p className="mt-1 text-xs leading-5 text-[#a8a8b2]">A integração do backend com AWS está preparada, mas a câmera e credenciais temporárias ainda precisam de configuração e homologação. Não existe reconhecimento facial ativo nesta tela.</p><button disabled className="btn-outline mt-3 opacity-50" title="Disponível após configuração segura do AWS Amplify e LGPD">Captura facial indisponível no momento</button></div>}
   {(c.status==="RASCUNHO"||c.status==="REJEITADA")&&<button className="btn-gold w-full sm:w-auto" disabled={busy} onClick={()=>act(`/v1/verificacoes/${c.id}/enviar`)}>Enviar para revisão humana</button>}
  </section>)}
  <p className="text-xs text-[#9b9ba4]">Ao enviar documentos pessoais, você concorda em iniciar a análise solicitada; a base legal, os prazos de guarda e os direitos dos titulares precisam estar definidos antes do lançamento público. <Link className="underline" href="/privacidade">Informações de privacidade</Link>.</p>
 </div>;
}
