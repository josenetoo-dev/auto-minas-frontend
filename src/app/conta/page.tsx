import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import EmailActivation from "@/components/email-activation";
export const metadata:Metadata={title:"Minha conta"};
export default async function Account(){const u=await requireUser();return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
 <h1 className="font-display text-4xl font-bold">Minha <span className="gold-text">conta</span></h1>
 <div className="card-dark space-y-3 p-6"><p><span className="text-[#9b9ba4]">Nome:</span> {u.name}</p><p><span className="text-[#9b9ba4]">E-mail:</span> {u.email}</p><p><span className="text-[#9b9ba4]">Estado:</span> {u.status==="ACTIVE"?"E-mail confirmado":u.status==="PENDING_CONTACT_VERIFICATION"?"Confirmação de e-mail pendente":u.status}</p><p><span className="text-[#9b9ba4]">Perfil:</span> {u.role}</p></div>
 {u.status==="PENDING_CONTACT_VERIFICATION"&&<EmailActivation/>}
 <div className="grid gap-4 sm:grid-cols-2"><Link className="card-dark p-6 hover:border-[#d4af37]/50" href="/verificacoes"><h2 className="font-display text-xl font-bold">Identidade e documentos →</h2><p className="mt-2 text-sm text-[#9b9ba4]">Acompanhe revisões e envie documentos de identidade e veículo.</p></Link><Link className="card-dark p-6 hover:border-[#d4af37]/50" href="/meus-anuncios"><h2 className="font-display text-xl font-bold">Meus anúncios →</h2><p className="mt-2 text-sm text-[#9b9ba4]">Consulte anúncios pendentes, rejeitados e ativos.</p></Link></div>
 {(u.role==="ADMIN"||u.role==="REVIEWER")&&<Link href="/moderacao" className="btn-outline">Abrir moderação</Link>}
 </div>}
