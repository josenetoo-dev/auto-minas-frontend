import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/legal-info.css";

export const metadata: Metadata = {
  title: "Roteiro de demonstração",
  description: "Experimente os recursos fictícios do Auto Minas na feira de tecnologia.",
  robots: { index: false, follow: false },
};

const STEPS = [
  { number: "01", title: "Explore os veículos", text: "Abra a vitrine, pesquise cidade/UF e visite os anúncios identificados como demonstração.", href: "/carros", action: "Explorar vitrine" },
  { number: "02", title: "Experimente uma negociação", text: "Com a conta fictícia de comprador, envie uma proposta de teste e acompanhe a conversa.", href: "/chat", action: "Ver negociações" },
  { number: "03", title: "Cadastre um anúncio de teste", text: "Na conta de demonstração, registre um veículo fictício: ele entrará em análise, não será publicado automaticamente.", href: "/vender", action: "Testar cadastro" },
  { number: "04", title: "Veja a revisão humana", text: "Com a conta de administrador da equipe, acompanhe a moderação e os fluxos de verificação sem documentos reais.", href: "/moderacao", action: "Painel da equipe" },
];

export default function FeiraPage() {
  if (process.env.NEXT_PUBLIC_DEPLOY_CHANNEL !== "staging") notFound();

  return (
    <div className="fair-page-screen">
      <header className="fair-page-topbar">
        <HistoryBackButton fallback="/" className="fair-page-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="fair-page-brand"><span>AM</span><strong>Auto Minas</strong></Link>
        <span className="fair-page-badge">Staging</span>
      </header>

      <main className="fair-page-content">
        <section className="fair-page-hero">
          <p className="fair-page-eyebrow">Feira de tecnologia · Auto Minas</p>
          <h1>Conheça o Auto Minas por dentro.</h1>
          <p>Um marketplace de veículos com anúncios sujeitos a moderação, verificação documental humana e negociação por propostas.</p>

          <div className="fair-page-note">
            Ambiente de demonstração: os veículos não estão à venda, as propostas não são ofertas reais e nenhuma consulta oficial a bases de veículos é realizada. Não envie documentos, selfies ou dados pessoais reais.
          </div>

          <div className="fair-page-actions">
            <Link href="/carros">Começar pela vitrine</Link>
            <Link href="/login">Entrar com conta de testes</Link>
          </div>
        </section>

        <section>
          <div className="fair-steps-heading">
            <p>Experimente em poucos passos</p>
            <h2>Roteiro para visitantes</h2>
          </div>

          <div className="fair-steps-grid">
            {STEPS.map(step => (
              <article key={step.number} className="fair-step-card">
                <span className="fair-step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <Link href={step.href}>{step.action} →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="fair-help-card">
          <h2>Dúvidas durante a demonstração?</h2>
          <p>Peça à equipe uma conta de testes. Os perfis de comprador, vendedor e administrador têm permissões diferentes para demonstrar o controle de acesso do sistema.</p>
        </section>
      </main>
    </div>
  );
}
