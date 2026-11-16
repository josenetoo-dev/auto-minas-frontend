import Link from "next/link";
import type { Metadata } from "next";
import { commercialPlans } from "@/lib/commercial";
import PlanCard from "@/components/plan-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos para anunciar" };

export default async function PlanosPage() {
  const plans = await commercialPlans().catch(() => null);
  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <h1 className="font-display text-3xl">Como você quer anunciar?</h1>
    <p className="mt-3 text-sm text-[#b7b3a9]">Publicar anúncios é gratuito. Recursos comerciais opcionais estão em preparação.</p>
    {!plans && <p role="alert" className="mt-6 text-amber-200">Não foi possível carregar os planos. Tente novamente.</p>}
    <Link href="/vender" className="btn-gold mt-5">Anunciar gratuitamente</Link>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{plans?.map(plan =>
      <PlanCard key={plan.codigo} plan={plan} href={`/vender/planos?plano=${encodeURIComponent(plan.codigo)}`} featured={false} />
    )}</div>
    <p className="mt-6 text-sm leading-6 text-[#b7b3a9]">Registre sua intenção sem cobrança. A contratação e a ativação dependem da configuração do pagamento e da confirmação válida. Anúncios gratuitos exigem e-mail confirmado e aprovação documental.</p>
  </div>;
}
