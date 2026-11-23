import { searchPublicCars, type CarData } from "@/lib/car";

/** Deterministic, public-catalogue similarity; never treats commercial promotion as verification. */
export async function similarCars(car: CarData, limit = 4): Promise<CarData[]> {
  const minPrice = Math.max(0, Math.floor(car.price * 0.65));
  const maxPrice = Math.ceil(car.price * 1.35);
  const candidates = new Map<number, CarData>();
  function score(other: CarData) {
    return (other.brand.toLowerCase() === car.brand.toLowerCase() ? 5 : 0)
      + (other.model.toLowerCase() === car.model.toLowerCase() ? 7 : 0)
      + (other.category === car.category ? 3 : 0)
      + (car.state && other.state === car.state ? 2 : 0)
      + (car.price > 0 ? 3 * Math.max(0, 1 - Math.abs(other.price - car.price) / car.price) : 0)
      + Math.max(0, 2 - Math.abs(other.year - car.year) / 5);
  }
  const add = (items: CarData[]) => {
    for (const item of items) {
      // Keep the demonstration catalogue separate from vehicles actually for sale.
      if (item.id !== car.id && item.statusApi === "ATIVO" && Boolean(item.isDemo) === Boolean(car.isDemo))
        candidates.set(item.id, item);
    }
  };
  const find = async (filters: Parameters<typeof searchPublicCars>[0]) => {
    try { add((await searchPublicCars({ ...filters, tipo: "CARRO" })).cars); }
    catch { /* Catálogo indisponível: preservar a página do anúncio. */ }
  };
  const ranked = () => [...candidates.values()].sort((a, b) => score(b) - score(a) || a.id - b.id).slice(0, limit);
  await find({ brand: car.brand, minPrice, maxPrice, page: 0 });
  if (candidates.size < limit) await find({ brand: car.brand, page: 0 });
  if (candidates.size < limit) await find({ minPrice, maxPrice, state: car.state || undefined, page: 0 });
  if (candidates.size < limit) await find({ minPrice, maxPrice, page: 0 });
  for (let page = 0; candidates.size < limit && page < 3; page++) await find({ page });
  return ranked();
}
