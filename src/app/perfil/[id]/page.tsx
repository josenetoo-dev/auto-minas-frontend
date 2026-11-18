import Link from "next/link";
import { notFound } from "next/navigation";
import { backendFetch, BackendError } from "@/lib/backend";
import { carById } from "@/lib/car";
import { formatPrice } from "@/lib/format";
import HistoryBackButton from "@/components/history-back-button";

type Perfil = {
  nome: string;
  temFoto: boolean;
  nivel: number;
  veiculos: { id: number; titulo: string }[];
  temMais: boolean;
};

const LEVEL_LABELS = ["Conta", "Identidade", "Veículo", "Reforçada", "Confiável"] as const;

export default async function PerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const page = Number((await searchParams).pagina || 0);
  if (!Number.isSafeInteger(page) || page < 0 || page > 100000) notFound();

  let perfil: Perfil;
  try {
    perfil = await backendFetch<Perfil>(`/v1/perfis/${id}?pagina=${page}`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    throw error;
  }

  const level = Math.max(0, Math.min(4, perfil.nivel ?? 0));
  const cars = await Promise.all(
    perfil.veiculos.map((vehicle) => carById(vehicle.id).catch(() => null)),
  );

  return (
    <div className="public-profile-screen">
      <header className="public-profile-topbar">
        <HistoryBackButton fallback="/carros" className="public-profile-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="public-profile-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <section className="public-profile-hero">
        <div className="public-profile-hero-car" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/demo/hb20.jpg" alt="" />
        </div>

        <div className="public-profile-person">
          <div className="public-profile-avatar">
            {perfil.temFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/perfil/${id}/foto`} alt={perfil.nome} />
            ) : (
              <span>{perfil.nome.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h1>
              {perfil.nome}
              {level > 0 && <span className="public-profile-check" aria-label="Perfil verificado">✓</span>}
            </h1>
            <p>{level > 0 ? "Vendedor verificado" : "Vendedor"}</p>
            <strong>Nível {level} · {LEVEL_LABELS[level]}</strong>
          </div>
        </div>
      </section>

      <main className="public-profile-content">
        <section className="public-profile-verification">
          <div className="public-profile-section-heading">
            <div>
              <h2>Nível de verificação</h2>
              <p>O nível exibido vem da análise registrada pelo Auto Minas.</p>
            </div>
            <span>Nível {level}</span>
          </div>

          <div className="public-profile-progress">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={item <= level ? "is-active" : ""}>
                <i>{item < level ? "✓" : item}</i>
                <strong>Nível {item}</strong>
                <small>{LEVEL_LABELS[item]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="public-profile-trust-note">
          <span>◈</span>
          <div>
            <strong>Transparência de verificação</strong>
            <p>O Auto Minas mostra apenas níveis e análises realmente registrados. Não exibimos métricas de reputação que ainda não são coletadas.</p>
          </div>
        </section>

        <section className="public-profile-listings">
          <div className="public-profile-listings-heading">
            <h2>Anúncios deste vendedor</h2>
            {perfil.temMais && <span>Há mais anúncios</span>}
          </div>

          <div className="public-profile-list">
            {cars.map((car, index) => {
              const fallback = perfil.veiculos[index];
              if (!car) {
                return (
                  <Link key={fallback.id} href={`/carros/${fallback.id}`} className="public-profile-car-card is-simple">
                    <div><strong>{fallback.titulo}</strong><small>Ver anúncio</small></div><b>›</b>
                  </Link>
                );
              }

              return (
                <Link key={car.id} href={`/carros/${car.id}`} className="public-profile-car-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={car.images[0] || "/images/car-placeholder.svg"} alt={`${car.brand} ${car.model}`} />
                  <div>
                    <strong>{car.brand} {car.model} {car.year}</strong>
                    <small>{car.version || car.category}</small>
                    <b>{formatPrice(car.price)}</b>
                  </div>
                  <em>›</em>
                </Link>
              );
            })}

            {!perfil.veiculos.length && <p className="public-profile-empty">Nenhum anúncio ativo nesta página.</p>}
          </div>

          {(page > 0 || perfil.temMais) && (
            <nav className="public-profile-pagination" aria-label="Paginação dos anúncios">
              {page > 0 && <Link href={`?pagina=${page - 1}`}>← Anterior</Link>}
              {perfil.temMais && <Link href={`?pagina=${page + 1}`}>Próxima →</Link>}
            </nav>
          )}
        </section>
      </main>
    </div>
  );
}
