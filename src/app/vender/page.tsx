import type { Metadata } from "next";
import SellForm from "@/components/sell-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vender carro",
  description: "Cadastre um veículo no Auto Minas e solicite a análise documental antes da publicação.",
};

export default async function VenderPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
          Auto Minas · Cadastro do veículo
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl">
          Vender meu <span className="gold-text">carro</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9b9ba4]">
          Preencha os dados do carro. O anúncio será criado como pendente, e só ficará público após análise de identidade, veículo e conteúdo.
        </p>
      </div>
      <SellForm mode="create" />
    </div>
  );
}
