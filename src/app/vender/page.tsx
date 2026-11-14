import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SellerAdOnboarding from "@/components/seller-ad-onboarding";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anunciar veículo",
  description: "Cadastre um veículo no Auto Minas e solicite a análise documental antes da publicação.",
};

export default async function VenderPage({ searchParams }: { searchParams: Promise<{ plano?: string; modalidade?: string }> }) {
  const { plano, modalidade } = await searchParams;
  const single = modalidade === "avulso";
  const params = new URLSearchParams();
  if (single) params.set("modalidade", "avulso");
  if (plano && ["BASIC", "PROFESSIONAL", "PREMIUM"].includes(plano)) params.set("plano", plano);
  const next = `/vender${params.size ? `?${params.toString()}` : ""}`;
  if (!await getSession()) redirect(`/login?next=${encodeURIComponent(next)}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
          {single ? "Anúncio avulso · Um veículo" : "Auto Minas · Área do anunciante"}
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl">
          Anunciar meu <span className="gold-text">veículo</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9b9ba4]">
          {single && "Prepare o anúncio do seu veículo. Preço e prazo do avulso serão informados antes da contratação. "}Cadastre seu veículo. O anúncio ficará pendente até a análise humana de identidade, veículo e conteúdo ser concluída.
        </p>
      </div>
      <SellerAdOnboarding returnTo={plano && ["BASIC", "PROFESSIONAL", "PREMIUM"].includes(plano) ? `/vender/planos?plano=${encodeURIComponent(plano)}` : undefined} />
    </div>
  );
}
