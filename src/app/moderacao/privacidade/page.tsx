import PrivacyAdmin from "@/components/privacy-admin";
import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {privateApi,type SpringPage} from "@/lib/backend";
import type {PrivacyRequest} from "@/components/privacy-requests";
export const dynamic="force-dynamic";
export default async function AdminPrivacy(){
 const user=await requireUser();if(user.role!=="ADMIN")notFound();
 let data:SpringPage<PrivacyRequest>|null=null;
 try{data=await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes/admin");}catch{}
 return <div className="mx-auto max-w-5xl space-y-6 px-5 py-12"><h1 className="market-heading">Solicitações de privacidade</h1><p className="text-sm leading-7 text-[#b7b3a9]">Analise identidade, retenções justificadas e dados em todos os operadores antes de concluir o atendimento. Registre aqui o andamento e a resposta ao titular. A eliminação exige conferir todos os locais onde os dados estão armazenados.</p>{data?<PrivacyAdmin initial={data.content}/>:<p role="alert">Não foi possível consultar os pedidos.</p>}</div>;
}
