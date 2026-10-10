import type { Metadata } from "next";
import { publicCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import CarFilters from "@/components/car-filters";
import { FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comprar carro",
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
  const fuel = str(sp.fuel) || undefined;
  const transmission = str(sp.transmission) || undefined;
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const yearMin = num(sp.yearMin);
  const sort = str(sp.sort) || "recentes";

  const cars = await publicCars().catch(() => null);
  const filtered = (cars || []).filter((c) => {
    const text = `${c.brand} ${c.model} ${c.version}`.toLocaleLowerCase("pt-BR");
    return (!q || text.includes(q.toLocaleLowerCase("pt-BR"))) &&
      (!brand || c.brand === brand) && (!fuel || c.fuel === fuel) &&
      (!transmission || c.transmission === transmission) &&
      (minPrice === undefined || c.price >= minPrice) &&
      (maxPrice === undefined || c.price <= maxPrice) &&
      (yearMin === undefined || c.year >= yearMin);
  });
  filtered.sort((a,b) => sort === "menor-preco" ? a.price-b.price :
      sort === "maior-preco" ? b.price-a.price : sort === "menor-km" ? a.mileageKm-b.mileageKm :
      new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const results = filtered.slice(0,1000);
  const brands = [...new Set((cars || []).map(c=>c.brand))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
          Vitrine de veículos
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl">
          Comprar <span className="gold-text">carro</span>
        </h1>
      </div>

      <CarFilters
        initial={{
          q: q ?? "",
          brand: brand ?? "",
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
        total={results.length}
      />

      <div className="divider-gold my-8" />

      {!cars && <p role="alert" className="mb-6 text-sm text-amber-300">A API está indisponível. Não foi possível consultar os anúncios neste momento.</p>}
      {results.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="card-dark mx-auto max-w-lg p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#d4af37]/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35M8 11h6" />
            </svg>
          </div>
          <h2 className="font-display mt-5 text-xl font-bold text-[#f4f3ee]">
            Nenhum veículo encontrado
          </h2>
          <p className="mt-2 text-sm text-[#9b9ba4]">
            Tente ajustar os filtros ou buscar por outro modelo.
          </p>
          <a href="/carros" className="btn-outline mt-6">
            Limpar filtros
          </a>
        </div>
      )}
    </div>
  );
}
