import Link from "next/link";
import type { CommercialPlan } from "@/lib/commercial";

type Props = {
  plan: CommercialPlan;
  href: string;
  featured: boolean;
};

export default function PlanCard({ plan, href, featured }: Props) {
  const unique = plan.periodicidade === "UNICO";
  let benefits: string[] = [];
  try {
    const parsed: unknown = JSON.parse(plan.beneficiosJson);
    if (Array.isArray(parsed)) {
      benefits = parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    benefits = [];
  }

  return (
    <article className={`flex h-full flex-col rounded-2xl border bg-[#111115] p-5 sm:p-6 ${featured ? "border-[#d4af37]" : "border-white/10"}`}>
      <h2 className="font-display text-2xl text-[#f4f3ee]">{plan.nome}</h2>
      <p className="mt-2 text-sm text-[#b7b3a9]">
        {unique ? "Pagamento único" : "Assinatura mensal"}
      </p>
      <p className="mt-5 text-4xl font-semibold text-[#f4f3ee]">
        {Number(plan.mensalidade).toLocaleString("pt-BR", { style: "currency", currency: plan.moeda })}
      </p>
      <p className="mt-1 text-sm text-[#b7b3a9]">{unique ? "por anúncio" : "por mês"}</p>
      <ul className="my-6 flex-1 space-y-3 text-sm leading-6 text-[#c3c3cc]">
        {benefits.map(benefit => <li key={benefit} className="flex gap-2">
          <span aria-hidden="true" className="text-[#d4af37]">✓</span>{benefit}
        </li>)}
      </ul>
      <Link href={href} className="btn-outline min-h-11 justify-center">Escolher {plan.nome}</Link>
      <p className="mt-3 text-xs leading-5 text-[#b7b3a9]">Pagamento ainda indisponível.</p>
    </article>
  );
}
