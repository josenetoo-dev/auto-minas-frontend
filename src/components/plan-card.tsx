import Link from "next/link";
import type { CommercialPlan } from "@/lib/commercial";

type Props = {
  plan: CommercialPlan;
  href: string;
  active?: boolean;
};

function benefitsFrom(plan: CommercialPlan) {
  try {
    const parsed: unknown = JSON.parse(plan.beneficiosJson);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function PlanCard({ plan, href, active = false }: Props) {
  const unique = plan.periodicidade === "UNICO";
  const benefits = benefitsFrom(plan);
  const price = Number(plan.mensalidade).toLocaleString("pt-BR", {
    style: "currency",
    currency: plan.moeda,
  });

  return (
    <article className={`plans-reference-card ${active ? "is-current" : ""}`}>
      <div className="plans-reference-card-icon" aria-hidden="true">
        {unique ? "▤" : "♛"}
      </div>

      <div className="plans-reference-card-copy">
        <div className="plans-reference-card-heading">
          <h2>{plan.nome}</h2>
          {active && <span>Atual</span>}
        </div>

        <p>{unique ? "Contratação única" : "Plano recorrente"}</p>

        <strong>
          {price}
          <small>{unique ? " / contratação" : " / mês"}</small>
        </strong>

        {benefits.length > 0 && (
          <ul>
            {benefits.slice(0, 4).map((benefit) => <li key={benefit}>✓ {benefit}</li>)}
          </ul>
        )}
      </div>

      <Link href={active ? "/assinatura" : href} className={active ? "is-current" : ""}>
        {active ? "Gerenciar" : "Escolher"}
      </Link>
    </article>
  );
}
