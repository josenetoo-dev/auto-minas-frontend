import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {privateApi,type SpringPage} from "@/lib/backend";
import PrivacyRequests,{type PrivacyRequest} from "@/components/privacy-requests";
export const dynamic="force-dynamic";
export const metadata={title:"Meus dados e privacidade"};
export default async function Requests(){
 if(!await getSession())redirect("/login?next=%2Fprivacidade%2Fsolicitacoes");
 let data:SpringPage<PrivacyRequest>|null=null;
 try{data=await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes");}catch{}
 return <div className="mx-auto max-w-3xl space-y-8 px-5 py-12"><header><p className="market-eyebrow">Seus direitos</p><h1 className="market-heading mt-4">Meus dados e privacidade</h1><p className="mt-4 text-sm leading-7 text-[#b7b3a9]">Solicitações gratuitas, vinculadas à sua conta. Não envie documento, CPF ou senha neste pedido.</p></header>{data?<PrivacyRequests initial={data.content}/>:<p role="alert" className="rounded-xl border border-amber-500/25 p-5 text-amber-200">O serviço de solicitações está temporariamente indisponível. Tente novamente em instantes.</p>}</div>;
}
