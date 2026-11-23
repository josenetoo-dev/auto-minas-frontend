import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { carById } from "@/lib/car";
import { BackendError, backendFetch, getApiToken } from "@/lib/backend";
import { getSession } from "@/lib/auth";
import ImageGallery from "@/components/image-gallery";
import ChatCta from "@/components/chat-cta";
import CarOwnerActions from "@/components/car-owner-actions";
import ReportButton from "@/components/report-button";
import HistoryBackButton from "@/components/history-back-button";
import FavoriteButton from "@/components/favorite-button";
import { formatPrice, formatKm } from "@/lib/format";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/constants";
import "@/styles/vehicle-detail.css";
import { HISTORY_QUESTIONS, HISTORY_OPTIONS, historyDetailKey } from "@/lib/vehicle-history";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type PublicProfile = {
  nome: string;
  temFoto: boolean;
  nivel: number;
  veiculos: { id: number; titulo: string }[];
  temMais: boolean;
};

type VerificationSummary = {
  vendedor: { analisadaManualmente: boolean; analisadaEm: string | null };
  veiculo: { analisadaManualmente: boolean; analisadaEm: string | null };
  aviso: string;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const car = await carById(Number(id));
    return {
      title: `${car.brand} ${car.model} ${car.year}`,
      description: `${car.brand} ${car.model} - ${formatPrice(car.price)}. Anúncio sujeito a análise Auto Minas.`,
    };
  } catch {
    return { title: "Anúncio não disponível" };
  }
}

function SpecIcon({ type }: { type: "year" | "km" | "fuel" | "gear" }) {
  if (type === "year") {
    return <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>;
  }
  if (type === "km") {
    return <><circle cx="12" cy="12" r="8" /><path d="M12 12l4-4M7 15a6 6 0 0 1 10-6" /></>;
  }
  if (type === "fuel") {
    return <><path d="M6 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M6 10h10M16 7h2l2 2v7a2 2 0 0 1-4 0v-3" /></>;
  }
  return <><path d="M5 4v16M12 4v16M19 4v16M5 9h14M12 15h7" /><circle cx="5" cy="4" r="1" /><circle cx="12" cy="4" r="1" /><circle cx="19" cy="4" r="1" /></>;
}

export default async function Detail({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await getSession();
  const token = await getApiToken();

  let car;
  try {
    car = await carById(Number(id), token || undefined);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    throw error;
  }

  const [profile, verification, favorite] = await Promise.all([
    backendFetch<PublicProfile>(`/v1/perfis/${car.userId}?pagina=0`).catch(() => null),
    backendFetch<VerificationSummary>(`/v1/anuncio/${car.id}/verificacoes`, {}, token || undefined).catch(() => null),
    token && !car.isDemo ? backendFetch<boolean>(`/v1/favoritos/${car.id}`, {}, token).catch(() => false) : false,
  ]);

  const owner = session?.id === car.userId;
  const sellerLevel = Math.max(0, Math.min(4, profile?.nivel ?? 0));
  const vehicleVerified = verification?.veiculo.analisadaManualmente ?? false;
  const sellerVerified = verification?.vendedor.analisadaManualmente ?? sellerLevel > 0;

  const specs = [
    { label: "Ano", value: String(car.year), icon: "year" as const },
    { label: "Quilometragem", value: formatKm(car.mileageKm), icon: "km" as const },
    { label: "Combustível", value: FUEL_LABEL[car.fuel] ?? car.fuel, icon: "fuel" as const },
    { label: "Câmbio", value: TRANSMISSION_LABEL[car.transmission] ?? car.transmission, icon: "gear" as const },
  ];

  return (
    <div className="vehicle-detail-screen">
      <header className="vehicle-detail-topbar">
        <HistoryBackButton fallback="/carros" className="vehicle-detail-icon-button" ariaLabel="Voltar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </HistoryBackButton>

        <Link href="/" className="vehicle-detail-brand" aria-label="Auto Minas">
          <span className="vehicle-detail-brand-mark">AM</span>
          <span>Auto Minas</span>
        </Link>

        <div className="vehicle-detail-top-actions">
          {!car.isDemo && <FavoriteButton id={car.id} initial={favorite} signedIn={Boolean(session)} />}
          <button type="button" className="vehicle-detail-icon-button is-disabled" aria-label="Compartilhamento pelo navegador" disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3M7 8l5-5 5 5" /><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
          </button>
        </div>
      </header>

      <main>
        <ImageGallery images={car.images} title={`${car.brand} ${car.model}`} />

        {car.isDemo && (
          <p className="vehicle-detail-demo-note">
            Anúncio demonstrativo.
          </p>
        )}

        <section className="vehicle-detail-main-info">
          <div className="vehicle-detail-heading-row">
            <div>
              <h1>{car.brand} {car.model} {car.year}</h1>
              <p>
                {car.version ? `${car.version} · ` : ""}
                {FUEL_LABEL[car.fuel] ?? car.fuel} · {TRANSMISSION_LABEL[car.transmission] ?? car.transmission}
              </p>
              <strong>{formatPrice(car.price)}</strong>
            </div>

            {vehicleVerified && (
              <span className="vehicle-verified-pill">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
                Veículo verificado
              </span>
            )}
          </div>

          <div className="vehicle-spec-grid">
            {specs.map((spec) => (
              <div key={spec.label} className="vehicle-spec-card">
                <svg viewBox="0 0 24 24" aria-hidden="true"><SpecIcon type={spec.icon} /></svg>
                <strong>{spec.value}</strong>
                <span>{spec.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="vehicle-detail-description">
          <h2>Descrição</h2>
          <p>{car.description}</p>
          <details>
            <summary>Ver mais</summary>
            <dl>
              <div><dt>Cor</dt><dd>{car.color}</dd></div>
              <div><dt>Categoria</dt><dd>{car.category}</dd></div>
              <div><dt>Documentação</dt><dd>{car.documentation}</dd></div>
              <div><dt>Garantia</dt><dd>{car.warranty}</dd></div>
            </dl>
          </details>
        </section>

        {car.vehicleHistory && (
          <section className="vehicle-history-card">
            <h2>Histórico e condições do veículo</h2>
            <p>Declarações fornecidas pelo vendedor. Estas respostas não constituem verificação ou garantia do Auto Minas.</p>
            <dl>
              {HISTORY_QUESTIONS.map(({key,label}) => {
                const answer = car.vehicleHistory![key];
                const details = car.vehicleHistory![historyDetailKey(key)];
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{HISTORY_OPTIONS.find((option)=>option.value===answer)?.label ?? "Não informado"}</dd>
                    {answer === "SIM" && details && <dd className="vehicle-history-detail">{details}</dd>}
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        <section className="vehicle-seller-card">
          <Link href={`/perfil/${car.userId}`} className="vehicle-seller-main">
            <div className="vehicle-seller-avatar">
              {profile?.temFoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/perfil/${car.userId}/foto`} alt={`Foto de ${profile.nome}`} />
              ) : (
                <span>{(profile?.nome ?? car.name).slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="vehicle-seller-copy">
              <h2>
                {profile?.nome ?? car.name}
                {sellerVerified && <span className="vehicle-seller-check" aria-label="Vendedor analisado">✓</span>}
              </h2>
              <p>{sellerVerified ? "Vendedor analisado" : "Vendedor"}{sellerLevel > 0 ? ` · Nível ${sellerLevel}` : ""}</p>
              <p className="vehicle-seller-location">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                {car.city && car.state ? `${car.city} - ${car.state}` : "Localização não informada"}
              </p>
            </div>

            <span className="vehicle-seller-chevron" aria-hidden="true">›</span>
          </Link>
        </section>

        <section className="vehicle-verification-card">
          <div className="vehicle-verification-heading">
            <span className="vehicle-verification-shield" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
            </span>
            <div>
              <p>Nível de verificação: {sellerLevel} de 4</p>
              <span>{verification?.aviso ?? "A análise pública informa o que foi revisado pela equipe Auto Minas."}</span>
            </div>
          </div>

          <div className="vehicle-verification-progress" aria-label={`Nível de verificação ${sellerLevel} de 4`}>
            {[1, 2, 3, 4].map((level) => (
              <span key={level} className={level <= sellerLevel ? "is-complete" : ""}>
                {level < sellerLevel ? "✓" : level}
              </span>
            ))}
          </div>
        </section>

        <section className="vehicle-detail-actions">
          <button type="button" className="vehicle-call-button" disabled title="Telefone público não disponível neste anúncio">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2Z" /></svg>
            Ligar
          </button>

          {owner ? (
            <div className="vehicle-owner-actions"><CarOwnerActions carId={car.id} status={car.status} /></div>
          ) : car.status === "ativo" ? (
            <ChatCta carId={car.id} price={car.price} loggedIn={!!session} nextPath={`/carros/${car.id}`} variant="detail" />
          ) : (
            <p className="vehicle-unavailable">Este anúncio não está disponível para negociação.</p>
          )}
        </section>

        {!owner && (
          <div className="vehicle-detail-report">
            <ReportButton carId={car.id} loggedIn={!!session} />
          </div>
        )}
      </main>
    </div>
  );
}
