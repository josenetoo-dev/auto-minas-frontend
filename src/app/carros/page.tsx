import type { Metadata } from "next";
import Link from "next/link";
import { searchPublicCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import CarFilters from "@/components/car-filters";
import { BRANDS, FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

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

  const catalog = await searchPublicCars({q,tipo,brand,city,state,fuel,transmission,minPrice,maxPrice,yearMin,sort,page}).catch(() => null);
  const results = catalog?.cars ?? [];
  const brands = [...BRANDS];
  return (
    <div className="am-page-wide">
      {/* Cabeçalho da página */}
      <div className="mb-5 sm:mb-6">
        <p className="am-eyebrow">Catálogo Auto Minas</p>\n        <h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl lg:text-5xl">
          Comprar <span className="gold-text">veículos</span>
        </h1>
      </div>

      <CarFilters
        initial={{
          q: q ?? "", tipo,
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

      <div className="divider-gold my-6 sm:my-8" />

      {!catalog && <p role="alert" className="mb-6 text-sm text-amber-300">A API está indisponível. Não foi possível consultar os anúncios neste momento.</p>}
      {results.length > 0 ? (
        <div className="catalog-results grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
            Nenhum {tipo === "MOTO" ? "moto" : "carro"} encontrado
          </h2>
          <p className="mt-2 text-sm text-[#9b9ba4]">
            Tente ajustar os filtros ou buscar por outro modelo.
          </p>
          <Link href="/carros" className="btn-outline mt-6">
            Limpar filtros
          </Link>
        </div>
      )}
      {catalog && catalog.totalPages > 1 && <nav aria-label="Paginação do catálogo" className="mt-8 flex items-center justify-center gap-4"><Link aria-disabled={page===0} className={`btn-outline ${page===0?'pointer-events-none opacity-40':''}`} href={`/carros?${new URLSearchParams({...Object.fromEntries(Object.entries(sp).filter(([,v])=>typeof v==='string') as [string,string][]),page:String(Math.max(0,page-1))})}`}>Anterior</Link><span className="text-sm text-[#a9a9b2]">Página {page+1} de {catalog.totalPages}</span><Link aria-disabled={page+1>=catalog.totalPages} className={`btn-outline ${page+1>=catalog.totalPages?'pointer-events-none opacity-40':''}`} href={`/carros?${new URLSearchParams({...Object.fromEntries(Object.entries(sp).filter(([,v])=>typeof v==='string') as [string,string][]),page:String(page+1)})}`}>Próxima</Link></nav>}
    </div>
  );
}
