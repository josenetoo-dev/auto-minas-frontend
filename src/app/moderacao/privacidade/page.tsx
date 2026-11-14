import {notFound} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {privateApi,type SpringPage} from "@/lib/backend";
import type {PrivacyRequest} from "@/components/privacy-requests";
export const dynamic="force-dynamic";
export default async function AdminPrivacy(){
 const user=await requireUser();if(user.role!=="ADMIN")notFound();
 let data:SpringPage<PrivacyRequest>|null=null;
 try{data=await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes/admin");}catch{}
 return <div className="mx-auto max-w-5xl space-y-6 px-5 py-12"><h1 className="market-heading">Solicitações de privacidade</h1><p className="text-sm leading-7 text-[#b7b3a9]">Analise identidade, retenções justificadas e dados em todos os operadores antes de concluir o atendimento. Esta tela registra recebimento; a eliminação exige procedimento operacional e resposta ao titular.</p>{data?<ul className="space-y-4">{data.content.map(item=><li key={item.id} className="card-dark p-5"><p>{item.protocolo} · Titular #{item.titularId}</p><p className="mt-2 text-sm text-[#b7b3a9]">{item.tipo} · {item.status} · {item.criadoEm} UTC</p></li>)}</ul>:<p role="alert">Não foi possível consultar os pedidos.</p>}</div>;
}
