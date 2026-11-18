import Link from "next/link";
import type { ReactNode } from "react";
import HistoryBackButton from "@/components/history-back-button";

export const LEGAL_VERSION = "2026-11-14-demo-v1";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const links = [
    ["/privacidade","Privacidade"],
    ["/termos","Termos"],
    ["/cookies","Cookies"],
    ["/reembolsos","Reembolsos"],
    ["/legal","Responsável e contato"],
    ["/privacidade/solicitacoes","Solicitar exclusão de dados"],
  ];

  return (
    <div className="legal-page-screen">
      <header className="legal-page-topbar">
        <HistoryBackButton fallback="/" className="legal-page-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="legal-page-brand"><span>AM</span><strong>Auto Minas</strong></Link>
        <span className="legal-page-badge">Transparência</span>
      </header>

      <main className="legal-page-content">
        <section className="legal-page-hero">
          <p className="legal-page-eyebrow">Transparência · Auto Minas</p>
          <h1>{title}</h1>
          <p>Informações oficiais da demonstração atual do Auto Minas, mantendo separadas funcionalidades existentes, recursos futuros e obrigações ainda em formalização.</p>
          <div className="legal-page-hero-meta">
            <span>Versão {LEGAL_VERSION}</span>
            <span>Atualizado em 14/11/2026</span>
          </div>
        </section>

        <section className="legal-page-demo-note">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Ambiente demonstrativo</strong>
            <p>Pagamentos estão desativados. Identificação do responsável e condições comerciais definitivas seguem em preparação antes da operação com pessoas reais.</p>
          </div>
        </section>

        <div className="legal-document">{children}</div>

        <nav aria-label="Políticas do site" className="legal-page-nav">
          {links.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </main>
    </div>
  );
}
