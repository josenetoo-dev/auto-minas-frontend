"use client";

import { useEffect, useState } from "react";
import { verificationStatus } from "@/lib/verification";

type Case = { tipo:string; status:string; motivoRejeicao?:string|null; evidencias:{tipo:string}[] };
const labels = {
  IDENTIDADE_FRENTE:"Frente do documento de identidade",
  IDENTIDADE_VERSO:"Verso do documento de identidade",
  DOCUMENTO_VEICULO:"Documento do veículo (CRLV)",
};
type Kind=keyof typeof labels;

async function result(response:Response) {
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body.error||body.detail||"Não foi possível enviar o documento. Tente novamente.");
  return body;
}

export function useListingDocuments(adId?:number|null) {
  const [cases,setCases]=useState<Case[]>([]);
  const [files,setFiles]=useState<Partial<Record<Kind,File>>>({});
  const [error,setError]=useState("");
  useEffect(()=>{
    let active=true;
    fetch(adId ? `/api/cars/${adId}/documents` : "/api/backend/v1/verificacoes/minhas?page=0&size=100").then(result).then(data=>{
      if(active) setCases(data.cases ?? data.content.filter((item:Case)=>item.tipo==="IDENTIDADE").map((item:Case)=>({...item,evidencias:[]})));
    }).catch(cause=>{if(active)setError(cause.message);});
    return()=>{active=false;};
  },[adId]);

  async function submit(id:number,manual=false) {
    setError("");
    const current=await result(await fetch(`/api/cars/${id}/documents`));
    for(const kind of Object.keys(labels) as Kind[]) {
      const item=(current.cases as Case[]).find(c=>c.tipo===(kind==="DOCUMENTO_VEICULO"?"VEICULO":"IDENTIDADE"));
      if(item?.status==="APROVADA" || item?.status==="EM_ANALISE" || item?.status==="INCONCLUSIVA") continue;
      const file=files[kind];
      if(!file) continue;
      const body=new FormData();
      body.append("tipo",kind);
      body.append("arquivo",file);
      await result(await fetch(`/api/cars/${id}/documents`,{method:"POST",body}));
    }
    await result(await fetch(`/api/cars/${id}/documents`,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({submit:true,manual}),
    }));
    const updated=await result(await fetch(`/api/cars/${id}/documents`));
    setCases(updated.cases);
    setFiles({});
  }

  const fields=<section className="card-dark min-w-0 space-y-4 p-4 sm:p-6">
    <h2 className="font-display text-2xl">Documentos para análise</h2>
    <p className="text-sm leading-6 text-[#b7b3a9]">Envie os documentos junto com os dados e fotos do carro. Os arquivos são privados e ficam disponíveis apenas para você e a equipe de análise.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(labels) as Kind[]).map(kind=>{
        const item=cases.find(c=>c.tipo===(kind==="DOCUMENTO_VEICULO"?"VEICULO":"IDENTIDADE"));
        const approved=item?.status==="APROVADA";
        const reviewing=item?.status==="EM_ANALISE" || item?.status==="INCONCLUSIVA";
        const received=item?.evidencias.some(e=>e.tipo===kind);
        return <div key={kind} className="min-w-0 rounded-xl border border-white/10 p-4">
          <label className="block text-sm font-semibold" htmlFor={`document-${kind}`}>{labels[kind]}</label>
          {item&&<p className="mt-2 text-sm text-[#b7b3a9]">{verificationStatus[item.status]||"Análise pendente"}</p>}
          {item?.motivoRejeicao&&<p className="mt-2 break-words rounded-lg border border-amber-400/20 p-3 text-sm text-amber-200">{item.motivoRejeicao}</p>}
          {approved || reviewing ? <p className="mt-2 text-sm text-[#b7b3a9]">{approved?"Documento aprovado":item?.status==="INCONCLUSIVA"?"A equipe fará a análise. Uma falha técnica não significa fraude.":"Documento em análise"}</p> : <>
            {received&&<p className="mt-2 text-sm text-emerald-300">Documento recebido. Selecione outro arquivo somente para substituí-lo.</p>}
            <input id={`document-${kind}`} type="file" accept="image/jpeg,image/png" className="mt-3 w-full min-w-0 text-sm"
              onChange={event=>{
                const file=event.target.files?.[0];
                if(file && (!["image/jpeg","image/png"].includes(file.type)||!file.size||file.size>4*1024*1024)) {
                  setError("Cada documento deve ser JPG ou PNG de até 4 MiB.");setFiles(current=>({...current,[kind]:undefined}));event.target.value="";return;
                }
                setError("");setFiles(current=>({...current,[kind]:file}));
              }}/>
            {files[kind]&&<p className="mt-2 break-all text-xs text-[#b7b3a9]">{files[kind]!.name}</p>}
          </>}
        </div>;
      })}
    </div>
    <p className="text-xs text-[#b7b3a9]">JPG ou PNG, até 4 MiB por arquivo. Consulte o <a href="/privacidade" className="underline">aviso de privacidade</a>.</p>
    {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
  </section>;
  return {fields,submit};
}

export default function ListingDocuments({adId}:{adId:number}) {
  const documents=useListingDocuments(adId);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  return <div className="space-y-4">{documents.fields}
    <div className="flex flex-wrap gap-3"><button disabled={busy} type="button" className="btn-gold" onClick={async()=>{
      setBusy(true);setError("");setMessage("");
      try {await documents.submit(adId);setMessage("Documentos enviados para análise.");}
      catch(cause){setError(cause instanceof Error?cause.message:"Falha de conexão.");}
      finally{setBusy(false);}
    }}>{busy?"Enviando…":"Enviar documentos para análise"}</button>
    <button disabled={busy} type="button" className="btn-outline" onClick={async()=>{
      setBusy(true);setError("");setMessage("");
      try {await documents.submit(adId,true);setMessage("Análise manual solicitada. O anúncio continua pendente.");}
      catch(cause){setError(cause instanceof Error?cause.message:"Falha de conexão.");}
      finally{setBusy(false);}
    }}>Preciso de análise manual</button></div>
    <p className="text-sm text-[#b7b3a9]">Se houver dificuldade na verificação, envie os arquivos disponíveis e solicite análise manual. Isso não aprova documentos nem libera a publicação automaticamente.</p>
    {message&&<p role="status" className="text-emerald-300">{message}</p>}
    {error&&<p role="alert" className="text-red-300">{error}</p>}
  </div>;
}
