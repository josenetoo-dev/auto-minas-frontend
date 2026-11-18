"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CarOwnerActions from "@/components/car-owner-actions";
import { formatPrice, formatDate } from "@/lib/format";

type Ad = {
  id:number;
  brand:string;
  model:string;
  version:string;
  year:number;
  price:number;
  status:string;
  createdAt:string;
  city:string;
  state:string;
  images:string[];
  vehicleId:number|null;
  rejectionReason:string|null;
};

type Filter = "all" | "ativo" | "pendente" | "pausado";

const statusLabel:Record<string,string>={
  ativo:"Ativo",
  pendente:"Em análise",
  rejeitado:"Rejeitado",
  pausado:"Pausado",
  vendido:"Vendido",
  arquivado:"Arquivado",
  suspenso:"Suspenso",
};

export default function MyAdsDashboard({ads}:{ads:Ad[]}) {
  const [filter,setFilter]=useState<Filter>("all");

  const counts=useMemo(()=>({
    all:ads.length,
    ativo:ads.filter(ad=>ad.status==="ativo").length,
    pendente:ads.filter(ad=>ad.status==="pendente").length,
    pausado:ads.filter(ad=>ad.status==="pausado").length,
  }),[ads]);

  const visible=filter==="all"?ads:ads.filter(ad=>ad.status===filter);

  return (
    <div className="my-ads-reference-screen">
      <header className="my-ads-topbar">
        <Link href="/conta" className="my-ads-back" aria-label="Voltar para a conta">←</Link>
        <Link href="/" className="my-ads-brand" aria-label="Auto Minas"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="my-ads-content">
        <section className="my-ads-heading">
          <div>
            <h1>Meus Anúncios</h1>
            <p>Gerencie seus veículos anunciados.</p>
          </div>
          <Link href="/vender" className="my-ads-new-button">+ Anunciar</Link>
        </section>

        <nav className="my-ads-tabs" aria-label="Filtrar anúncios">
          {[
            ["all",`Todos (${counts.all})`],
            ["ativo",`Ativos (${counts.ativo})`],
            ["pendente",`Em análise (${counts.pendente})`],
            ["pausado",`Pausados (${counts.pausado})`],
          ].map(([value,label])=>(
            <button
              key={value}
              type="button"
              className={filter===value?"is-active":""}
              onClick={()=>setFilter(value as Filter)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="my-ads-list">
          {visible.length===0 && (
            <div className="my-ads-empty">
              <p>Nenhum anúncio neste status.</p>
              <Link href="/vender">Cadastrar veículo</Link>
            </div>
          )}

          {visible.map(ad=>(
            <article key={ad.id} className="my-ad-card">
              <div className="my-ad-main">
                <Link href={`/meus-anuncios/${ad.id}`} className="my-ad-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.images[0]||"/images/car-placeholder.svg"} alt={`${ad.brand} ${ad.model} ${ad.year}`} />
                </Link>

                <div className="my-ad-copy">
                  <div className="my-ad-title-row">
                    <div>
                      <Link href={`/meus-anuncios/${ad.id}`}><h2>{ad.brand} {ad.model} {ad.version || ad.year}</h2></Link>
                      <strong>{formatPrice(ad.price)}</strong>
                    </div>
                    <span className={`my-ad-status status-${ad.status}`}>
                      <i /> {statusLabel[ad.status]||ad.status}
                    </span>
                  </div>

                  <p className="my-ad-date">
                    <span aria-hidden="true">▣</span>
                    {ad.status==="pendente"?"Enviado":"Criado"} em {formatDate(ad.createdAt)}
                  </p>

                  {ad.city && ad.state && <p className="my-ad-location">{ad.city} - {ad.state}</p>}
                </div>

                <details className="my-ad-menu">
                  <summary aria-label="Ações do anúncio">⋮</summary>
                  <div>
                    <CarOwnerActions carId={ad.id} status={ad.status}/>
                  </div>
                </details>
              </div>

              {ad.status==="pendente" && (
                <div className="my-ad-analysis-note">
                  <span aria-hidden="true">◷</span>
                  <p><strong>Seu anúncio está em análise.</strong><small>A equipe de verificação está revisando as informações enviadas.</small></p>
                </div>
              )}

              {ad.rejectionReason && (
                <div className="my-ad-rejection-note">
                  <strong>Motivo da rejeição</strong>
                  <p>{ad.rejectionReason}</p>
                </div>
              )}

              {ad.vehicleId && (
                <Link href={`/verificacoes?anuncio=${ad.id}`} className="my-ad-verification-link">
                  Ver documentos e verificações →
                </Link>
              )}
            </article>
          ))}
        </section>
      </main>

      <div className="my-ads-bottom-glow" aria-hidden="true"/>
    </div>
  );
}
