import type { Metadata } from "next";
import SellerAdOnboarding from "@/components/seller-ad-onboarding";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anunciar veículo",
  description: "Cadastre um veículo no Auto Minas e solicite a análise documental antes da publicação.",
};

export default async function VenderPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  await requireUser();
  const { plano } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
          Auto Minas · Área do anunciante
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl">
          Anunciar meu <span className="gold-text">veículo</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9b9ba4]">
          Cadastre seu veículo. O anúncio ficará pendente até a análise humana de identidade, veículo e conteúdo ser concluída.
        </p>
      </div>
      <SellerAdOnboarding returnTo={plano && ["BASIC", "PROFESSIONAL", "PREMIUM"].includes(plano) ? `/vender/planos?plano=${encodeURIComponent(plano)}` : undefined} />
    </div>
  );
}
