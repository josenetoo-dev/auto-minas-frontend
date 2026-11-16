import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import VerificationsDashboard from "@/components/verifications-dashboard";
export const metadata:Metadata={title:"Verificações"};
export default async function Page(){const u=await requireUser();return <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Segurança</p><h1 className="font-display mt-2 text-3xl font-bold">Documentos dos meus veículos</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#9b9ba4]">Escolha o veículo para acompanhar a análise ou corrigir seus documentos. Você também pode enviá-los ao cadastrar o anúncio.</p></div>{u.status!=="ACTIVE"&&<p className="card-dark p-5 text-amber-200">Confirme seu e-mail em <a className="underline" href="/conta">Minha conta</a> para liberar a publicação. Você pode acompanhar os documentos abaixo.</p>}<VerificationsDashboard/></div>}
