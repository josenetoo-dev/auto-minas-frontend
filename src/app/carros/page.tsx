import type { Metadata } from "next";
import Link from "next/link";
import { searchPublicCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import CarFilters from "@/components/car-filters";
import { BRANDS, FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants";

export const revalidate = 20;

export const metadata: Metadata = {
  title: "Comprar veículos",
  description: "Encontre veículos com anúncios analisados na plataforma Auto Minas.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CarrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = str(sp.q)?.trim() || undefined;
  const brand = str(sp.brand) || undefined;
  const city = str(sp.city)?.trim() || undefined;
  const state = str(sp.state) || undefined;
  const fuel = str(sp.fuel) || undefined;
  const transmission = str(sp.transmission) || undefined;
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const yearMin = num(sp.yearMin);
  const sort = str(sp.sort) || "recentes";
  const tipo = str(sp.tipo) === "MOTO" ? "MOTO" : "CARRO";
  const page = Math.max(0, num(sp.page) ?? 0);

  const catalog = await searchPublicCars({
    q,
    tipo,
    brand,
    city,
    state,
    fuel,
    transmission,
    minPrice,
    maxPrice,
    yearMin,
    sort,
    page,
  }).catch(() => null);

  const results = catalog?.cars ?? [];
  const brands = [...BRANDS];

  return (
    <div className="cars-exact-screen">
      <section className="cars-reference-hero">
        <div className="cars-reference-hero-copy">
          <h1>Buscar veículos</h1>
          <p>Encontre o carro ideal para você.</p>
        </div>
        <div className="cars-reference-hero-car" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/demo/onix.jpg" alt="" />
        </div>
      </section>

      <CarFilters
        initial={{
          q: q ?? "",
          tipo,
          brand: brand ?? "",
          city: city ?? "",
          state: state ?? "",
          fuel: fuel ?? "",
          transmission: transmission ?? "",
          minPrice: minPrice !== undefined ? String(minPrice) : "",
          maxPrice: maxPrice !== undefined ? String(maxPrice) : "",
          yearMin: yearMin !== undefined ? String(yearMin) : "",
          sort,
        }}
        brands={brands}
        fuelOptions={FUEL_OPTIONS}
        transmissionOptions={TRANSMISSION_OPTIONS}
        total={catalog?.total ?? 0}
      />

      <section className="cars-results-section">
        {!catalog && (
          <p role="alert" className="cars-api-warning">
            A API está indisponível. Não foi possível consultar os anúncios neste momento.
          </p>
        )}

        {results.length > 0 ? (
          <div className="cars-results-list">
            {results.map((car) => (
              <CarCard key={car.id} car={car} variant="catalog" />
            ))}
          </div>
        ) : (
          <div className="cars-empty-state">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35M8 11h6" />
            </svg>
            <h2>Nenhum {tipo === "MOTO" ? "moto" : "carro"} encontrado</h2>
            <p>Tente ajustar os filtros ou buscar por outro modelo.</p>
            <Link href="/carros">Limpar filtros</Link>
          </div>
        )}

        {catalog && catalog.totalPages > 1 && (
          <nav aria-label="Paginação do catálogo" className="cars-pagination">
            <Link
              aria-disabled={page === 0}
              className={page === 0 ? "is-disabled" : ""}
              href={`/carros?${new URLSearchParams({
                ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]),
                page: String(Math.max(0, page - 1)),
              })}`}
            >
              Anterior
            </Link>
            <span>Página {page + 1} de {catalog.totalPages}</span>
            <Link
              aria-disabled={page + 1 >= catalog.totalPages}
              className={page + 1 >= catalog.totalPages ? "is-disabled" : ""}
              href={`/carros?${new URLSearchParams({
                ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]),
                page: String(page + 1),
              })}`}
            >
              Próxima
            </Link>
          </nav>
        )}
      </section>
    </div>
  );
}
