import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {privateApi,type SpringPage} from "@/lib/backend";
import PrivacyRequests,{type PrivacyRequest} from "@/components/privacy-requests";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/legal-info.css";

export const dynamic="force-dynamic";
export const metadata={title:"Meus dados e privacidade"};

export default async function Requests(){
  if(!await getSession())redirect("/login?next=%2Fprivacidade%2Fsolicitacoes");

  let data:SpringPage<PrivacyRequest>|null=null;
  try{data=await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes");}catch{}

  return (
    <div className="info-page-screen">
      <header className="info-page-topbar">
        <HistoryBackButton fallback="/privacidade" className="info-page-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="info-page-brand"><span>AM</span><strong>Auto Minas</strong></Link>
        <span className="info-page-badge">Privacidade</span>
      </header>

      <main className="info-page-content">
        <section className="info-page-hero">
          <p className="info-page-eyebrow">Seus direitos</p>
          <h1>Meus dados e privacidade</h1>
          <p>Solicitações gratuitas, vinculadas à sua conta. Não envie documento, CPF ou senha neste pedido.</p>
        </section>

        <div className="privacy-requests-page">
          {data
            ? <PrivacyRequests initial={data.content}/>
            : <p role="alert" className="legal-page-demo-note">O serviço de solicitações está temporariamente indisponível. Tente novamente em instantes.</p>}
        </div>
      </main>
    </div>
  );
}
