import PrivacyAdmin from "@/components/privacy-admin";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { privateApi, type SpringPage } from "@/lib/backend";
import type { PrivacyRequest } from "@/components/privacy-requests";
import AdminShell from "@/components/admin-shell";
import "@/styles/admin.css";

export const dynamic="force-dynamic";

export default async function AdminPrivacy(){
  const user=await requireUser();
  if(user.role!=="ADMIN")notFound();

  let data:SpringPage<PrivacyRequest>|null=null;
  try{
    data=await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes/admin");
  }catch{}

  return (
    <AdminShell
      role="ADMIN"
      title="Privacidade e solicitações"
      description="Acompanhe pedidos de titulares, retenções justificadas e histórico de atendimento."
      active="privacy"
    >
      {data
        ? <PrivacyAdmin initial={data.content}/>
        : <p role="alert" className="card-dark p-5 text-amber-200">Não foi possível consultar os pedidos.</p>}
    </AdminShell>
  );
}
