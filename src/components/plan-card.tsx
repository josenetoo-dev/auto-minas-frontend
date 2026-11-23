import Link from "next/link";
import type { CommercialPlan } from "@/lib/commercial";

type Props = {
  plan: CommercialPlan;
  href: string;
  upgrade?: boolean;
  downgradeBlocked?: boolean;
};

function benefitsFrom(plan: CommercialPlan) {
  try {
    const parsed: unknown = JSON.parse(plan.beneficiosJson);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function PlanCard({ plan, href, upgrade = false, downgradeBlocked = false }: Props) {
  const unique = plan.periodicidade === "UNICO";
  const benefits = benefitsFrom(plan);
  const price = plan.mensalidade === null ? "Preço a definir" : Number(plan.mensalidade).toLocaleString("pt-BR", {
    style: "currency",
    currency: plan.moeda,
  });

  return (
    <article className={`plans-reference-card ${upgrade ? "is-current" : ""}`}>
      <div className="plans-reference-card-icon" aria-hidden="true">
        {unique ? "▤" : "♛"}
      </div>

      <div className="plans-reference-card-copy">
        <div className="plans-reference-card-heading">
          <h2>{plan.nome}</h2>
          {upgrade && <span>Upgrade</span>}
        </div>

        <p>{unique ? "Contratação única" : "Plano recorrente"}</p>

        <strong>
          {price}
          {plan.mensalidade !== null && <small>{unique ? " / contratação" : " / mês"}</small>}
        </strong>

        {benefits.length > 0 && (
          <ul>
            {benefits.slice(0, 4).map((benefit) => <li key={benefit}>✓ {benefit}</li>)}
          </ul>
        )}
      </div>

      {plan.mensalidade === null
        ? <span className="plans-reference-locked">Contratação indisponível até definir o preço</span>
        : downgradeBlocked
        ? <span className="plans-reference-locked" aria-label="Downgrade indisponível">Downgrade indisponível</span>
        : <Link href={href} className={upgrade ? "is-current" : ""}>
            {upgrade ? "Melhorar plano" : "Escolher plano"}
          </Link>
      }
    </article>
  );
}
