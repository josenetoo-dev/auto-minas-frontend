import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { allPages, getApiToken } from "@/lib/backend";
import { carById } from "@/lib/car";
import type { BackendProposal } from "@/lib/chat";
import { formatPrice } from "@/lib/format";
import AdManagementActions from "@/components/ad-management-actions";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Gerenciamento do anúncio"};

const statusLabel:Record<string,string>={
  ativo:"Publicado",
  pendente:"Em análise",
  rejeitado:"Rejeitado",
  pausado:"Pausado",
  vendido:"Vendido",
  arquivado:"Arquivado",
  suspenso:"Suspenso",
};

export default async function AdManagementPage({params}:{params:Promise<{id:string}>}) {
  const user=await requireUser();
  const {id}=await params;
  if(!/^\d+$/.test(id)) notFound();

  const token=await getApiToken();
  const car=await carById(Number(id),token||undefined).catch(()=>null);
  if(!car || car.userId!==user.id) notFound();

  const proposals=token
    ? await allPages<BackendProposal>("/v1/proposta/minhas",token).catch(()=>[])
    : [];
  const proposalCount=proposals.filter(item=>item.anuncio===car.id).length;

  return (
    <div className="ad-management-screen">
      <header className="ad-management-topbar">
        <Link href="/meus-anuncios" className="ad-management-back" aria-label="Voltar para meus anúncios">←</Link>
        <Link href="/" className="ad-management-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="ad-management-content">
        <section className="ad-management-heading">
          <div>
            <h1>Gerenciamento do anúncio</h1>
            <p>Controle, edite e acompanhe o estado do seu anúncio.</p>
          </div>
          <div className="ad-management-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 64 48">
              <path d="M7 31h34l4-12H16l-5 12Z"/>
              <path d="M5 31v7h5M43 31v7h-5"/>
              <circle cx="15" cy="38" r="3"/>
              <circle cx="34" cy="38" r="3"/>
              <circle cx="50" cy="31" r="10"/>
              <path d="M50 25v12M44 31h12"/>
            </svg>
          </div>
        </section>

        <section className="ad-management-summary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={car.images[0]||"/images/car-placeholder.svg"} alt={`${car.brand} ${car.model} ${car.year}`} />
          <div className="ad-management-summary-copy">
            <div className="ad-management-summary-title">
              <div>
                <h2>{car.brand} {car.model}</h2>
                <p>{car.version} · {car.year}</p>
              </div>
              <span className={`ad-management-status status-${car.status}`}>
                <i /> {statusLabel[car.status]||car.status}
              </span>
            </div>
            <strong>{formatPrice(car.price)}</strong>

            <div className="ad-management-real-metrics">
              <span><b>{proposalCount}</b><small>propostas</small></span>
              <span><b>{car.images.length}</b><small>fotos</small></span>
              <span><b>{car.city||"—"}</b><small>{car.state||"localização"}</small></span>
            </div>
          </div>
        </section>

        {car.status==="pendente" && (
          <div className="ad-management-state-note is-pending">
            <strong>Anúncio em análise</strong>
            <p>Ele ainda não está público. A equipe de verificação precisa concluir a revisão.</p>
          </div>
        )}

        {car.status==="rejeitado" && car.rejectionReason && (
          <div className="ad-management-state-note is-rejected">
            <strong>Correção necessária</strong>
            <p>{car.rejectionReason}</p>
          </div>
        )}

        <AdManagementActions carId={car.id} status={car.status} vehicleId={car.vehicleId}/>

        <p className="ad-management-grounding">
          O Auto Minas ainda não coleta métricas de visualizações/favoritos para o anunciante. Por isso esta tela exibe apenas dados efetivamente registrados.
        </p>
      </main>

      <div className="ad-management-bottom-glow" aria-hidden="true"/>
    </div>
  );
}
