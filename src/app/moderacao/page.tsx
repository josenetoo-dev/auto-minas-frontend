import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ModerationDashboard from "@/components/moderation-dashboard";
import AdminShell from "@/components/admin-shell";
import "@/styles/admin.css";

export const metadata:Metadata={title:"Moderação"};

export default async function Moderation(){
  const user=await requireUser();
  if(user.role!=="ADMIN"&&user.role!=="REVIEWER")notFound();

  return (
    <AdminShell
      role={user.role}
      title="Painel de moderação"
      description="Revise anúncios, documentos e denúncias com rastreabilidade e controle de acesso."
      active="moderation"
    >
      <ModerationDashboard role={user.role} reviewerId={user.id}/>
    </AdminShell>
  );
}
