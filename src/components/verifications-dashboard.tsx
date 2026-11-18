"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingDocuments from "@/components/listing-documents";

type Ad={id:number;marca:string;modelo:string;ano:number};
export default function VerificationsDashboard() {
  const [ads,setAds]=useState<Ad[]>([]);
  const [selected,setSelected]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    fetch("/api/cars").then(async response=>{
      const body=await response.json();
      if(!response.ok) throw new Error(body.detail||body.error||"Não foi possível carregar seus veículos.");
      return body.content as Ad[];
    }).then(items=>{
      if(!active)return;
      setAds(items);
      const requested=new URLSearchParams(window.location.search).get("anuncio");
      setSelected(items.some(item=>String(item.id)===requested)?requested!:String(items[0]?.id??""));
    }).catch(cause=>{if(active)setError(cause.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);
  return <div className="verification-dashboard">
    {error&&<p role="alert" className="verification-dashboard-error">{error}</p>}
    {loading?<p role="status" className="verification-dashboard-loading">Carregando seus veículos…</p>:ads.length===0?<p className="verification-dashboard-empty">Seus documentos são enviados junto do anúncio. <Link href="/vender">Cadastrar veículo</Link></p>:<>
      <div className="verification-vehicle-selector"><label htmlFor="document-vehicle">Escolha seu veículo</label>
        <select id="document-vehicle" className="verification-vehicle-select" value={selected} onChange={event=>setSelected(event.target.value)}>
          {ads.map(ad=><option key={ad.id} value={ad.id}>{ad.marca} {ad.modelo} · {ad.ano}</option>)}
        </select>
      </div>
      {selected&&<ListingDocuments key={selected} adId={Number(selected)}/>}
    </>}
  </div>;
}
