import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { commercialPlans } from "@/lib/commercial";
import AdminCommercialConsole from "@/components/admin-commercial-console";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração comercial" };

export default async function CommercialAdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  const plans = await commercialPlans().catch(() => []);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><header><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d4af37]">Administração restrita</p><h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Operação <span className="gold-text">comercial</span></h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#a9a9b2]">Área para configuração de benefícios, revisão manual de pagamentos externos e gestão de versões contratuais. A interface não processa cobranças.</p></header>{plans.length ? <AdminCommercialConsole plans={plans}/> : <p role="alert" className="card-dark p-5 text-amber-200">Não foi possível carregar os planos.</p>}</main>;
}
