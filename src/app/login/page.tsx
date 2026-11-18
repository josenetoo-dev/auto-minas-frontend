import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
import HistoryBackButton from "@/components/history-back-button";
import { safeNextPath } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre ou crie sua conta no Auto Minas para cadastrar anúncios e enviar propostas.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { next, error, mode: requestedMode } = await searchParams;
  const safeNext = safeNextPath(next);
  const mode = requestedMode === "register" ? "register" : "login";

  return (
    <div className={`auth-reference-screen ${mode === "register" ? "is-register" : "is-login"}`}>
      <HistoryBackButton fallback="/" className="auth-reference-back" ariaLabel="Voltar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      </HistoryBackButton>

      <section className="auth-reference-hero">
        <div className="auth-reference-brand">
          <span className="auth-reference-brand-mark">AM</span>
          <span>Auto Minas</span>
        </div>

        <div className="auth-reference-hero-copy">
          {mode === "login" ? (
            <>
              <h1>Acesse sua conta no <span>Auto Minas</span></h1>
              <p>Entre para anunciar, negociar e acompanhar seus veículos.</p>
            </>
          ) : (
            <>
              <h1>Criar sua conta no <span>Auto Minas</span></h1>
              <p>Junte-se à plataforma e anuncie, negocie e encontre o seu próximo veículo com mais segurança.</p>
            </>
          )}
        </div>

        <div className="auth-reference-car" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/demo/hb20.jpg" alt="" />
        </div>
      </section>

      <div className="auth-reference-form-wrap">
        <AuthForm next={safeNext} error={error} initialMode={mode} />
      </div>

      <div className="auth-reference-glow" aria-hidden="true" />
    </div>
  );
}
