import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
import Logo from "@/components/logo";
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
    <div className="am-auth-shell">
      <section className="am-auth-art">
        <div className="relative z-10 max-w-xl">
          <p className="am-eyebrow">Auto Minas</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-[#f6f3eb] xl:text-5xl">
            Entre para negociar, anunciar e acompanhar seus veículos.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#aaa8a0]">
            Uma conta concentra suas conversas, anúncios, verificações e dados de vendedor em um único lugar.
          </p>
          <div className="am-metric-grid mt-8 max-w-lg">
            <div className="am-metric"><strong>1 conta</strong><span>Todo o histórico</span></div>
            <div className="am-metric"><strong>Direto</strong><span>Chat entre usuários</span></div>
            <div className="am-metric"><strong>Controle</strong><span>Anúncios e verificações</span></div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[100dvh] flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 md:hidden"><Logo /></div>
          <AuthForm next={safeNext} error={error} />
        </div>
      </section>
    </div>
  );
}
