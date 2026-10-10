import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { carById, publicCars } from "@/lib/car";
import { BackendError, getApiToken } from "@/lib/backend";
import { getSession } from "@/lib/auth";
import ImageGallery from "@/components/image-gallery";
import CarCard from "@/components/car-card";
import ChatCta from "@/components/chat-cta";
import CarOwnerActions from "@/components/car-owner-actions";
import ReportButton from "@/components/report-button";
import { formatDate,formatPrice,formatKm } from "@/lib/format";
import { FUEL_LABEL,TRANSMISSION_LABEL } from "@/lib/constants";
export const dynamic="force-dynamic";
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {id}=await params;
 try{const c=await carById(Number(id));return{title:`${c.brand} ${c.model} ${c.year}`,description:`${c.brand} ${c.model} - ${formatPrice(c.price)}. Anúncio sujeito a análise Auto Minas.`};}
 catch{return{title:"Anúncio não disponível"};}
}
export default async function Detail({params}:Props){
 const {id}=await params;if(!/^\d+$/.test(id))notFound();
 const session=await getSession(),token=await getApiToken();
 let c;try{c=await carById(Number(id),token||undefined);}catch(e){if(e instanceof BackendError&&e.status===404)notFound();throw e;}
 const owner=session?.id===c.userId;
 const similar=(await publicCars(2).catch(()=>[])).filter(x=>x.id!==c.id&&x.brand===c.brand).slice(0,3);
 return <div className="mx-auto max-w-7xl space-y-8 px-4 py-9 sm:px-6">
  <nav className="text-sm text-[#9b9ba4]"><Link href="/carros" className="hover:text-[#d4af37]">Veículos</Link> / {c.brand} {c.model}</nav>
  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
   <div className="space-y-7"><ImageGallery images={c.images} title={`${c.brand} ${c.model}`}/>
    <section className="card-dark space-y-4 p-6"><h2 className="font-display text-2xl font-bold">Características</h2>
     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{[["Marca",c.brand],["Modelo",c.model],["Versão",c.version],["Ano",c.year],["Quilometragem",formatKm(c.mileageKm)],["Combustível",FUEL_LABEL[c.fuel]||c.fuel],["Câmbio",TRANSMISSION_LABEL[c.transmission]||c.transmission],["Cor",c.color]].map(([label,value])=><div key={label} className="rounded-lg bg-[#15151a] p-3"><p className="text-xs text-[#92929d]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>
    </section>
    <section className="card-dark p-6"><h2 className="font-display mb-3 text-2xl font-bold">Descrição do anúncio</h2><p className="whitespace-pre-wrap leading-relaxed text-[#c3c3cc]">{c.description}</p></section>
    {similar.length>0&&<section className="space-y-4"><h2 className="font-display text-2xl font-bold">Veículos semelhantes</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map(x=><CarCard key={x.id} car={x}/>)}</div></section>}
   </div>
   <aside className="space-y-5"><div className="card-dark sticky top-24 space-y-5 p-6">
    <span className="text-xs uppercase tracking-[.22em] text-[#d4af37]">Auto Minas • {c.status==="ativo"?"Anúncio público":c.status.replace(/_/g," ")}</span>
    <h1 className="font-display text-3xl font-bold">{c.brand} {c.model} <span className="text-xl text-[#9b9ba4]">{c.year}</span></h1>
    <p className="gold-text font-display text-3xl font-bold">{formatPrice(c.price)}</p>
    <p className="text-sm text-[#9b9ba4]">Anunciante: {c.name} • Criado em {formatDate(c.createdAt)}</p>
    <p className="rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 p-3 text-xs text-[#c7c2b2]">Análise humana de documentos não equivale a certificação governamental ou garantia de propriedade e pagamento.</p>
    {owner?<CarOwnerActions carId={c.id} status={c.status}/>:c.status==="ativo"?<><ChatCta carId={c.id} price={c.price} loggedIn={!!session} nextPath={`/carros/${c.id}`}/><ReportButton carId={c.id} loggedIn={!!session}/></>:<p className="text-amber-300">Este anúncio não está disponível para negociação.</p>}
   </div></aside>
  </div>
 </div>;
}
