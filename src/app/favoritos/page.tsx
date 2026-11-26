import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch, getApiToken } from "@/lib/backend";
import { carSummaryById } from "@/lib/car";
import CarCard from "@/components/car-card";
import "@/styles/cars.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favoritos" };
export default async function Favorites() {
  await requireUser();
  const token = await getApiToken();
  const ids = await backendFetch<number[]>("/v1/favoritos", {}, token || undefined);
  const resolved = await Promise.all(ids.map(id => carSummaryById(id, token || undefined).catch(() => null)));
  const cars = resolved.filter(car => car?.statusApi === "ATIVO");
  return <main className="mx-auto max-w-5xl px-4 py-10 text-white">
    <Link href="/conta" className="underline">← Minha conta</Link>
    <h1 className="my-8 text-3xl font-bold">Meus favoritos</h1>
    {cars.length ? <div className="cars-results-list">{cars.map(car => car && <CarCard key={car.id} car={car} variant="catalog" />)}</div>
      : <p>Você ainda não salvou anúncios disponíveis. <Link href="/carros" className="underline">Explorar carros</Link></p>}
  </main>;
}
