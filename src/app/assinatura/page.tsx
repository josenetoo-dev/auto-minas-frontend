import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { mySubscriptions } from "@/lib/commercial";
import SubscriptionPanel from "@/components/subscription-panel";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Minha assinatura"};
export default async function SubscriptionPage(){await requireUser();const subscriptions=await mySubscriptions().catch(()=>[]);return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6"><header><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d4af37]">Área do vendedor</p><h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Minha <span className="gold-text">assinatura</span></h1><p className="mt-3 text-sm leading-6 text-[#a9a9b2]">Histórico de intenções, vigência e situação financeira. Pagamentos e cancelamentos têm processamento externo/manual; nenhum pagamento é simulado nesta tela.</p></header><SubscriptionPanel initial={subscriptions}/></div>;}
