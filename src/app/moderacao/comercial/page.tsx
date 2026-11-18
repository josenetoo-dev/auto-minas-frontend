import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { commercialPlans } from "@/lib/commercial";
import AdminCommercialConsole from "@/components/admin-commercial-console";
import AdminShell from "@/components/admin-shell";
import "@/styles/admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administração comercial" };

export default async function CommercialAdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();

  const plans = await commercialPlans().catch(() => []);

  return (
    <AdminShell
      role="ADMIN"
      title="Administração comercial"
      description="Gerencie planos, intenções comerciais e versões contratuais sem simular cobranças."
      active="commercial"
    >
      {plans.length
        ? <AdminCommercialConsole plans={plans}/>
        : <p role="alert" className="card-dark p-5 text-amber-200">Não foi possível carregar os planos.</p>}
    </AdminShell>
  );
}
