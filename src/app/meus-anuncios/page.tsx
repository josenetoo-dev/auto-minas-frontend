import type { Metadata } from "next";
import Link from "next/link";
import { myCars } from "@/lib/car";
import { requireUser } from "@/lib/auth";
import { formatPrice,formatDate } from "@/lib/format";
import CarOwnerActions from "@/components/car-owner-actions";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Meus anúncios"};
const statusText:Record<string,string>={ativo:"Publicado",pendente:"Em análise",rejeitado:"Rejeitado",pausado:"Pausado",vendido:"Vendido",arquivado:"Arquivado",suspenso:"Suspenso pela moderação"};
export default async function MyAds(){
 await requireUser();const ads=await myCars();
 const active=ads.filter(c=>c.status==="ativo").length,pending=ads.filter(c=>c.status==="pendente").length;
 return <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-[#d4af37]">Área do vendedor</p><h1 className="font-display mt-2 text-4xl font-bold">Meus <span className="gold-text">anúncios</span></h1></div><Link href="/vender" className="btn-gold">+ Cadastrar veículo</Link></div>
  <div className="grid grid-cols-3 gap-4">{[["Total",ads.length],["Publicados",active],["Em análise",pending]].map(([label,value])=><div key={label} className="card-dark p-5"><p className="font-display text-3xl font-bold text-[#f2d87e]">{value}</p><p className="text-xs text-[#9b9ba4]">{label}</p></div>)}</div>
  {ads.length===0?<div className="card-dark p-10 text-center">Nenhum veículo cadastrado. <Link href="/vender" className="text-[#d4af37] underline">Cadastrar agora</Link></div>:ads.map(c=><article key={c.id} className="card-dark flex flex-col gap-5 p-5 sm:flex-row">
   <img src={c.images[0]||"/images/car-placeholder.svg"} alt="Veículo" className="h-36 w-full rounded-lg object-cover sm:w-52"/>
   <div className="flex-1"><Link className="font-display text-xl font-bold hover:text-[#d4af37]" href={`/carros/${c.id}`}>{c.brand} {c.model} {c.year}</Link><p className="gold-text mt-1 text-xl font-bold">{formatPrice(c.price)}</p>
   <p className="mt-2 text-xs text-[#9b9ba4]">{statusText[c.status]||c.status} · Criado em {formatDate(c.createdAt)}</p>
   <p className="mt-1 text-xs text-[#9b9ba4]">Localização do veículo: {c.city && c.state ? `${c.city}/${c.state}` : "Não informada"}</p>
   {c.rejectionReason&&<p className="my-2 rounded border border-amber-500/40 bg-amber-950/20 p-3 text-sm text-amber-200">Motivo da rejeição: {c.rejectionReason}</p>}
   {c.vehicleId&&<Link href={`/verificacoes?veiculo=${c.vehicleId}`} className="mt-2 inline-block text-sm text-[#f2d87e] underline">Enviar/verificar documentos do veículo</Link>}
   </div><div className="shrink-0"><CarOwnerActions carId={c.id} status={c.status}/></div>
  </article>)}
 </div>;
}
