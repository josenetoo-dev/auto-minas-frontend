"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ActionIcon({type}:{type:"edit"|"photos"|"view"|"verify"|"pause"|"reactivate"|"archive"|"sold"|"plans"}) {
  if(type==="edit") return <><path d="m4 20 4-1 10-10-3-3L5 16l-1 4Z"/><path d="m13 8 3 3"/></>;
  if(type==="photos") return <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6 17 4-4 3 3 2-2 3 3"/></>;
  if(type==="view") return <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>;
  if(type==="verify") return <><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>;
  if(type==="pause") return <><path d="M5 5v14M19 5v14"/><path d="M3 3 21 21"/></>;
  if(type==="reactivate") return <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.5 8.5A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 11.5-1.5"/></>;
  if(type==="sold") return <><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>;
  if(type==="plans") return <><path d="M4 16 12 3l2 7 6 2-12 9 1-7-5 2Z"/></>;
  return <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></>;
}

export default function AdManagementActions({
  carId,
  status,
  vehicleId,
}:{
  carId:number;
  status:string;
  vehicleId:number|null;
}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function transition(target:"pausado"|"pendente"|"vendido") {
    let payload:Record<string,unknown>={status:target};

    if(target==="vendido") {
      const raw=window.prompt("Informe o valor final da venda (R$).");
      if(raw===null) return;
      const normalized=raw.trim().replace(/^R\$\s*/i,"").replace(/\s/g,"");
      const amount=Number(normalized.includes(",")?normalized.replace(/\./g,"").replace(",","."):normalized);
      if(!Number.isFinite(amount)||amount<=0){setError("Informe um valor final válido.");return;}
      const now=new Date();
      const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
      const date=window.prompt("Data da venda (AAAA-MM-DD).",today);
      if(date===null) return;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){setError("Informe a data no formato AAAA-MM-DD.");return;}
      payload={status:target,valorFinal:amount,dataVenda:date};
    }

    const question=
      target==="pausado"?"Pausar este anúncio? Ele deixará a vitrine pública.":
      target==="pendente"?"Solicitar reativação? O anúncio voltará para análise.":
      "Marcar este anúncio como vendido? Essa ação é definitiva.";

    if(!window.confirm(question)) return;

    setBusy(true);setError("");
    try {
      const response=await fetch(`/api/cars/${carId}`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||"Não foi possível atualizar o anúncio.");
      router.refresh();
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if(!window.confirm("Arquivar este anúncio? Ele deixará de aparecer publicamente, mas o histórico será preservado.")) return;
    setBusy(true);setError("");
    try {
      const response=await fetch(`/api/cars/${carId}`,{method:"DELETE"});
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||"Não foi possível arquivar o anúncio.");
      router.push("/meus-anuncios");
      router.refresh();
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  const editable=!["vendido","suspenso","arquivado"].includes(status);

  return (
    <>
      <section className="ad-management-action-grid">
        {editable && (
          <Link href={`/vender/editar/${carId}`} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="edit"/></svg>
            <strong>Editar anúncio</strong>
          </Link>
        )}

        {editable && (
          <Link href={`/vender/editar/${carId}?step=3`} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="photos"/></svg>
            <strong>Gerenciar fotos</strong>
          </Link>
        )}

        {status==="ativo" && (
          <Link href={`/carros/${carId}`} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="view"/></svg>
            <strong>Ver anúncio</strong>
          </Link>
        )}

        {vehicleId && (
          <Link href={`/verificacoes?anuncio=${carId}`} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="verify"/></svg>
            <strong>Verificações</strong>
          </Link>
        )}

        <Link href="/planos" className="ad-management-action-card">
          <svg viewBox="0 0 24 24"><ActionIcon type="plans"/></svg>
          <strong>Opções de destaque</strong>
          <small>Em preparação</small>
        </Link>

        {status==="ativo" && (
          <button type="button" disabled={busy} onClick={()=>void transition("pausado")} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="pause"/></svg>
            <strong>Pausar anúncio</strong>
          </button>
        )}

        {status==="pausado" && (
          <button type="button" disabled={busy} onClick={()=>void transition("pendente")} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="reactivate"/></svg>
            <strong>Solicitar reativação</strong>
          </button>
        )}

        {["ativo","pausado"].includes(status) && (
          <button type="button" disabled={busy} onClick={()=>void transition("vendido")} className="ad-management-action-card">
            <svg viewBox="0 0 24 24"><ActionIcon type="sold"/></svg>
            <strong>Marcar vendido</strong>
          </button>
        )}
      </section>

      <section className="ad-management-secondary-list">
        <Link href="/chat">
          <span>Conversas e propostas</span>
          <b>›</b>
        </Link>
        <Link href={vehicleId?`/verificacoes?anuncio=${carId}`:"/verificacoes"}>
          <span>Documentos e segurança</span>
          <b>›</b>
        </Link>
        {status!=="arquivado" && (
          <button type="button" disabled={busy} onClick={()=>void archive()} className="is-danger">
            <span>Arquivar anúncio</span>
            <b>›</b>
          </button>
        )}
      </section>

      {error && <p className="ad-management-error" role="alert">{error}</p>}
    </>
  );
}
