"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import VerificationReview from "@/components/verification-review";
import { verificationStatus } from "@/lib/verification";
type Ad={id:number;titulo:string;marca:string;modelo:string;preco:number;status:string;usuarioNome:string;usuarioId:number;veiculoId:number|null};
type Verification={id:number;tipo:string;status:string;veiculoId:number|null;motivoRejeicao:string|null;solicitanteNome?:string;veiculoDescricao?:string|null};
type Report={id:number;anuncioId:number;categoria:string;status:string;relato:string;motivoDecisao:string|null};
type Evidence={id:number;tipo:string;tamanho:number};
async function api<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const res=await fetch(`/api/backend${path}`,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,cache:"no-store"});
 if(!res.ok){const b=await res.json().catch(()=>({}));throw new Error(b.detail||b.error||"Operação não permitida");}
 return res.status===204?undefined as T:res.json();
}
export default function ModerationDashboard({role,reviewerId}:{role:"ADMIN"|"REVIEWER";reviewerId:number}){
 const [tab,setTab]=useState<"ads"|"identity"|"reports">("ads"),[ads,setAds]=useState<Ad[]>([]),[ver,setVer]=useState<Verification[]>([]),[reports,setReports]=useState<Report[]>([]);
 const previewDialog=useRef<HTMLDialogElement>(null);
 const [preview,setPreview]=useState<{url:string;name:string}|null>(null);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url);},[preview]);
 const [packets,setPackets]=useState<Record<number,Verification[]>>({});
 const [checked,setChecked]=useState<Record<number,boolean>>({});
 const [verificationFilter,setVerificationFilter]=useState("");
 const [reason,setReason]=useState<Record<number,string>>({}),[evidence,setEvidence]=useState<Record<number,Evidence[]>>({}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const load=useCallback(async()=>{const [a,v,d]=await Promise.all([
  api<{content:Ad[]}>("/v1/moderacao/anuncios?page=0&size=100"),api<{content:Verification[]}>(`/v1/verificacoes/revisao/pendentes?page=0&size=100${verificationFilter?`&status=${verificationFilter}`:""}`),
  api<{content:Report[]}>("/v1/denuncias/revisao/pendentes?page=0&size=100")]);setAds(a.content);setVer(v.content);setReports(d.content);},[verificationFilter]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Falha de conexão"));},0);return()=>window.clearTimeout(timer);},[load]);
 async function decide(url:string,justification?:string){setBusy(true);setError("");setSuccess("");try{await api(url,"POST",justification===undefined?undefined:{motivo:justification});await load();setSuccess("Decisão registrada e auditada.");}catch(e){setError(e instanceof Error?e.message:"Erro");}finally{setBusy(false);}}
 async function showDocs(id:number){try{const docs=await api<Evidence[]>(`/v1/verificacoes/${id}/evidencias`);setEvidence(x=>({...x,[id]:docs}));}catch(e){setError(e instanceof Error?e.message:"Erro");}}
 async function showPacket(ad:Ad) {
  setError("");
  try {
   const items=await api<Verification[]>(`/v1/moderacao/anuncios/${ad.id}/documentos`);
   setPackets(current=>({...current,[ad.id]:items}));
   for(const item of items) await showDocs(item.id);
  } catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível carregar os documentos.");}
 }
 async function publishReviewed(id:number) {
  setBusy(true);setError("");setSuccess("");
  try {
   await api(`/v1/moderacao/anuncios/${id}/aprovar`,"POST",{requisitosConferidos:checked[id]===true});
   await load();setSuccess("Anúncio publicado.");
  } catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível publicar.");}
  finally{setBusy(false);}
 }
 async function download(id:number,doc:Evidence){try{const r=await fetch(`/api/backend/v1/verificacoes/${id}/evidencias/${doc.id}/arquivo`);if(!r.ok)throw new Error("Acesso negado");const url=URL.createObjectURL(await r.blob());setPreview({url,name:doc.tipo==="IDENTIDADE_FRENTE"?"Frente da identidade":doc.tipo==="IDENTIDADE_VERSO"?"Verso da identidade":"Documento do veículo (CRLV)"});previewDialog.current?.showModal();}catch(e){setError(e instanceof Error?e.message:"Erro");}}
 const note=(id:number)=><textarea className="input-dark mt-3 min-h-20" maxLength={500} aria-label="Justificativa da decisão" placeholder="Justificativa da decisão (obrigatória para rejeições)" value={reason[id]||""} onChange={e=>setReason(x=>({...x,[id]:e.target.value}))}/>;
 return <div className="space-y-5">
 <dialog ref={previewDialog} onClose={()=>setPreview(null)} aria-label="Documento privado para análise" className="m-auto max-h-[90dvh] w-[min(900px,94vw)] overflow-auto rounded-xl border border-white/20 bg-[#111316] p-4 text-[#f4f3ee]">
 <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-xl">{preview?.name}</h2><button type="button" className="btn-outline" onClick={()=>previewDialog.current?.close()}>Fechar documento</button></div>
 {preview&&<><img src={preview.url} alt={preview.name} className="mx-auto max-h-[70dvh] max-w-full object-contain"/><a href={preview.url} download="documento-privado" className="mt-4 inline-flex min-h-11 items-center underline">Baixar documento</a></>}
 </dialog><div className="nice-scroll flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">{[["ads","Anúncios",ads.length],["identity","Documentos",ver.length],["reports","Denúncias",reports.length]].map(([key,title,count])=><button key={key} type="button" className={`${tab===key?"btn-gold":"btn-outline"} min-h-11 shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:px-5 sm:text-sm`} onClick={()=>setTab(key as typeof tab)}>{title} ({count})</button>)}</div>
 {error&&<p role="alert" className="rounded bg-red-950/30 p-4 text-red-300">{error}</p>}{success&&<p role="status" className="text-emerald-300">{success}</p>}
 {tab==="ads"&&(ads.length?ads.map(a=><section key={a.id} className="card-dark min-w-0 p-4 sm:p-5"><h2 className="font-display break-words text-lg font-bold sm:text-xl">{a.titulo}</h2><p className="mt-1 text-sm text-[#9b9ba4]">{a.marca} {a.modelo} • R$ {a.preco} • Anunciante: {a.usuarioNome}</p><p className="mt-3 text-xs text-amber-300">Publicação gratuita após conferir o anúncio e os documentos. A revisão não constitui certificação oficial.</p><button type="button" className="btn-outline mt-4" onClick={()=>showPacket(a)}>Analisar documentos deste anúncio</button>
 {packets[a.id]&&<div className="mt-4 grid gap-3 sm:grid-cols-2">{packets[a.id].length===0?<p>O anunciante ainda não enviou os documentos.</p>:packets[a.id].map(item=><div key={item.id} className="rounded-xl border border-white/10 p-4">
 <h3 className="font-semibold">{item.tipo==="IDENTIDADE"?"Identidade do anunciante":"Documento do veículo (CRLV)"}</h3>
 <p className="mt-2 text-sm text-[#b7b3a9]">{verificationStatus[item.status]||"Análise pendente"}</p>
 {(evidence[item.id]||[]).map(doc=><button type="button" key={doc.id} className="mt-2 block min-h-11 text-left text-sm text-[#e4ca91] underline" onClick={()=>download(item.id,doc)}>{doc.tipo==="IDENTIDADE_FRENTE"?"Abrir frente da identidade":doc.tipo==="IDENTIDADE_VERSO"?"Abrir verso da identidade":"Abrir documento do veículo"}</button>)}
 <VerificationReview item={item} role={role} canApprove={item.tipo!=="VEICULO"||!!packets[a.id]?.some(c=>c.tipo==="IDENTIDADE"&&c.status==="APROVADA")} onUpdated={async()=>{await load();await showPacket(a);}}/>
 </div>)}</div>}
 <p className="mt-3 text-sm text-[#b7b3a9]">A publicação exige a aprovação da identidade e do CRLV, além de pelo menos duas fotos do veículo.</p>
 <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={!!checked[a.id]} disabled={!packets[a.id]?.length} onChange={event=>setChecked(current=>({...current,[a.id]:event.target.checked}))}/>Conferi a identidade, o CPF, a maioridade do anunciante e o vínculo com este veículo.</label>
 {reviewerId===a.usuarioId && <p className="mt-3 text-sm text-amber-200">Este anúncio é seu. Outro moderador precisa tomar a decisão.</p>}
 <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy||reviewerId===a.usuarioId||!checked[a.id]||packets[a.id]?.length!==2||!packets[a.id]?.every(item=>item.status==="APROVADA")} className="btn-gold min-h-11 flex-1 text-center sm:flex-none" onClick={()=>publishReviewed(a.id)}>Publicar anúncio</button></div><form className="mt-4 space-y-2" onSubmit={event=>{event.preventDefault();const motivo=String(new FormData(event.currentTarget).get("motivo")||"").trim();if(motivo)void decide(`/v1/moderacao/anuncios/${a.id}/rejeitar`,motivo);}}>
  <label className="block text-sm">Motivo da rejeição enviado ao anunciante
    <textarea name="motivo" required maxLength={500} className="input-dark mt-1" placeholder="Explique o que precisa ser corrigido." onChange={e=>e.target.setCustomValidity(e.target.value.trim()?"":"Escreva o motivo da rejeição.")}/>
  </label><button disabled={busy||reviewerId===a.usuarioId} type="submit" className="btn-outline min-h-11">Rejeitar anúncio</button></form></section>):<p className="card-dark p-6">Nenhum anúncio aguardando revisão.</p>)}
 {tab==="identity"&&<label className="block text-sm">Filtrar análises documentais<select className="input-dark mt-2" value={verificationFilter} onChange={event=>{setError("");setVerificationFilter(event.target.value);}}>
 <option value="">Aguardando análise</option>{["CORRECAO_NECESSARIA","EXPIRADA","REJEITADA","APROVADA"].map(status=><option key={status} value={status}>{verificationStatus[status]}</option>)}</select></label>}
 {tab==="identity"&&(ver.length?ver.map(v=><section key={v.id} className="card-dark min-w-0 p-4 sm:p-5"><h2 className="font-display break-words text-lg font-bold sm:text-xl">{v.tipo==="IDENTIDADE"?"Identidade do anunciante":"Documento do veículo (CRLV)"}{v.veiculoDescricao?` · ${v.veiculoDescricao}`:v.solicitanteNome?` · ${v.solicitanteNome}`:""}</h2><p className="mt-2 text-sm text-[#b7b3a9]">{v.solicitanteNome}</p>
 <button className="btn-outline mt-3 w-full sm:w-auto" onClick={()=>showDocs(v.id)}>Ver evidências privadas</button>{(evidence[v.id]||[]).map(d=><div key={d.id} className="mt-3 flex min-w-0 flex-wrap items-center gap-3 text-sm"><span>{d.tipo} ({Math.round(d.tamanho/1024)} KB)</span><button className="text-[#d4af37] underline" onClick={()=>download(v.id,d)}>Baixar</button></div>)}
 <VerificationReview item={v} role={role} onUpdated={load}/></section>):<p className="card-dark p-6">Nenhum documento neste filtro.</p>)}
 {tab==="reports"&&(reports.length?reports.map(d=><section key={d.id} className="card-dark min-w-0 p-4 sm:p-5"><h2 className="font-display break-words text-lg font-bold sm:text-xl">Denúncia sobre anúncio</h2><p className="mt-1 text-sm text-amber-300">{d.categoria} · {d.status === "EM_ANALISE" ? "Em análise" : "Recebida"}</p><p className="mt-3 whitespace-pre-wrap text-sm text-[#c4c4cc]">{d.relato}</p>{note(d.id)}<div className="mt-3 flex flex-wrap gap-2">{d.status === "ABERTA" && <button disabled={busy} className="btn-outline min-h-11 flex-1 text-center sm:flex-none" onClick={()=>decide(`/v1/denuncias/revisao/${d.id}/iniciar`)}>Iniciar análise</button>}<button disabled={busy||!reason[d.id]?.trim()} className="btn-gold min-h-11 flex-1 text-center sm:flex-none" onClick={()=>decide(`/v1/denuncias/revisao/${d.id}/confirmar`,reason[d.id])}>Confirmar e suspender</button><button disabled={busy||!reason[d.id]?.trim()} className="btn-outline min-h-11 flex-1 text-center sm:flex-none" onClick={()=>decide(`/v1/denuncias/revisao/${d.id}/descartar`,reason[d.id])}>Descartar</button></div></section>):<p className="card-dark p-6">Nenhuma denúncia pendente.</p>)}
 </div>;
}
