import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SellerAdOnboarding from "@/components/seller-ad-onboarding";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anunciar veículo",
  description: "Cadastre um veículo no Auto Minas e envie o anúncio para análise antes da publicação.",
};

export default async function VenderPage() {
  if (!await getSession()) redirect("/login?next=%2Fvender");
  return <SellerAdOnboarding />;
}
