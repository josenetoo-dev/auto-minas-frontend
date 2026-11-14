import Link from "next/link";
import { featuredCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import SearchBox from "./search-box";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await featuredCars(6).catch(() => null);
  return <div className="market-home">
    <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 sm:pt-10">
      <h1 className="font-display text-2xl sm:text-4xl">Buscar veículos</h1>
      <div className="mt-4 max-w-3xl"><SearchBox /></div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Veículos em destaque</h2>
        <Link href="/carros" className="market-text-link">Ver catálogo completo →</Link>
      </div>
      {!featured && <p role="alert" className="rounded-xl border border-amber-500/20 p-5 text-sm text-amber-200">A API Auto Minas está indisponível. Tente novamente em instantes.</p>}
      {featured && featured.length === 0 && <p className="rounded-xl border border-white/10 p-6 text-[#aaa69e]">Novos veículos aparecerão aqui após a aprovação dos anúncios.</p>}
      <div className="home-vehicle-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured?.map(car => <CarCard key={car.id} car={car} />)}</div>
    </section>
  </div>;
}
