import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SellerAdOnboarding from "@/components/seller-ad-onboarding";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anunciar veículo",
  description: "Cadastre um veículo no Auto Minas e solicite a análise documental antes da publicação.",
};

export default async function VenderPage() {
  if (!await getSession()) redirect("/login?next=%2Fvender");
  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <h1 className="font-display text-3xl">Anunciar meu veículo</h1>
    <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-[#b7b3a9]">Publicar é gratuito. Preencha os dados, adicione fotos e documentos e envie tudo para análise.</p>
    <SellerAdOnboarding />
  </div>;
}
