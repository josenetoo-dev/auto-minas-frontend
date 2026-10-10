import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ModerationDashboard from "@/components/moderation-dashboard";
export const metadata:Metadata={title:"Moderação"};
export default async function Moderation(){const u=await requireUser();if(u.role!=="ADMIN"&&u.role!=="REVIEWER")notFound();
 return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><p className="text-xs uppercase tracking-widest text-[#d4af37]">Área restrita — {u.role}</p><h1 className="font-display mt-2 text-4xl font-bold">Painel de <span className="gold-text">moderação</span></h1><p className="mt-3 mb-6 text-sm text-[#9b9ba4]">Análise humana. Aprovação de anúncio exige identidade e veículo previamente aprovados. Nenhuma operação desta tela é consulta governamental.</p><ModerationDashboard role={u.role}/></div>;
}
