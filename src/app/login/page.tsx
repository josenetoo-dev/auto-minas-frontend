import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
import { safeNextPath } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre ou crie sua conta no Auto Minas para cadastrar anúncios e enviar propostas.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <div className="auth-reference-screen">
      <LinkBack />
      <section className="auth-reference-hero">
        <div className="auth-reference-brand">
          <span className="auth-reference-brand-mark">AM</span>
          <span>Auto Minas</span>
        </div>

        <div className="auth-reference-hero-copy auth-login-copy">
          <h1>Acesse sua conta no <span>Auto Minas</span></h1>
          <p>Entre para anunciar, negociar e acompanhar seus veículos.</p>
        </div>

        <div className="auth-reference-car" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/demo/hb20.jpg" alt="" />
        </div>
      </section>

      <div className="auth-reference-form-wrap">
        <AuthForm next={safeNext} error={error} />
      </div>

      <div className="auth-reference-glow" aria-hidden="true" />
    </div>
  );
}

function LinkBack() {
  return (
    <a href="/" className="auth-reference-back" aria-label="Voltar para a página inicial">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
    </a>
  );
}
