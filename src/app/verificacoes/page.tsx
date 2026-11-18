import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch } from "@/lib/backend";
import VerificationsDashboard from "@/components/verifications-dashboard";
import HistoryBackButton from "@/components/history-back-button";

export const metadata: Metadata = { title: "Verificações" };

type PublicProfile = {
  nome: string;
  temFoto: boolean;
  nivel: number;
  veiculos: { id: number; titulo: string }[];
  temMais: boolean;
};

const LEVEL_LABELS = ["Conta", "Identidade", "Veículo", "Reforçada", "Confiável"] as const;

export default async function Page() {
  const user = await requireUser();
  const profile = await backendFetch<PublicProfile>(`/v1/perfis/${user.id}?pagina=0`).catch(() => null);
  const level = Math.max(0, Math.min(4, profile?.nivel ?? 0));

  return (
    <div className="verification-reference-screen">
      <header className="verification-reference-topbar">
        <HistoryBackButton fallback="/conta" className="verification-reference-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="verification-reference-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="verification-reference-content">
        <header className="verification-reference-heading">
          <h1>Verificações</h1>
          <p>Acompanhe sua identidade e os documentos dos veículos anunciados.</p>
        </header>

        <section className="verification-level-card">
          <div>
            <small>Nível atual</small>
            <h2>Nível {level}</h2>
            <p>{LEVEL_LABELS[level]}</p>
          </div>
          <span>◈</span>
        </section>

        <div className="verification-progress">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={item <= level ? "is-active" : ""}>
              <i>{item < level ? "✓" : item}</i>
              <strong>Nível {item}</strong>
              <small>{LEVEL_LABELS[item]}</small>
            </div>
          ))}
        </div>

        {user.status !== "ACTIVE" && (
          <Link href="/verificar-email" className="verification-email-warning">
            <strong>Confirme seu e-mail</strong>
            <span>A publicação permanece bloqueada enquanto o contato não estiver confirmado.</span>
            <b>›</b>
          </Link>
        )}

        <section className="verification-documents-heading">
          <h2>Identidade e documentos</h2>
          <p>Selecione um anúncio para acompanhar a análise ou corrigir os arquivos enviados.</p>
        </section>

        <VerificationsDashboard />
      </main>

      <div className="verification-reference-glow" aria-hidden="true" />
    </div>
  );
}
