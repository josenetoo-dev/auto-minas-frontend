import type { Metadata } from "next";
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
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Painel visual */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(145deg, #08080a, #221d15, #100e12)" }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <p className="badge-gold">Área do cliente</p>
            <h2 className="font-display mt-5 text-4xl font-bold leading-tight text-[#f4f3ee]">
              Negocie, anuncie e{" "}
              <span className="gold-text italic">acelere</span> suas vendas
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                "Anuncie seu carro gratuitamente em minutos",
                "Chat direto entre comprador e vendedor",
                "Gerencie seus anúncios e negociações",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#d8d8d2]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#d4af37]/20 text-[#f2d87e]">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-[#5c5c66]">© {new Date().getFullYear()} Auto Minas Veículos</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <AuthForm next={safeNext} error={error} />
      </div>
    </div>
  );
}
