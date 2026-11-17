import Link from "next/link";
import { formatKm, formatPrice } from "@/lib/format";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/constants";

export type CarCardData = {
  id: number;
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  price: number;
  mileageKm: number;
  fuel: string;
  transmission: string;
  color: string;
  city: string;
  state: string;
  images: string[];
  status?: string;
  isDemo?: boolean;
};

export default function CarCard({
  car,
  variant = "default",
}: {
  car: CarCardData;
  variant?: "default" | "catalog";
}) {
  const sold = car.status === "vendido";
  const image = car.images[0] ?? "/images/car-placeholder.svg";

  if (variant === "catalog") {
    return (
      <Link href={`/carros/${car.id}`} className={`cars-result-card ${sold ? "is-sold" : ""}`}>
        <div className="cars-result-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${car.brand} ${car.model} ${car.year}`} loading="lazy" />
        </div>

        <div className="cars-result-copy">
          <div className="cars-result-title-row">
            <h2>{car.brand} {car.model} {car.year}</h2>
            <span className="cars-result-heart" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
            </span>
          </div>

          <p className="cars-result-meta">
            {car.version ? `${car.version} · ` : ""}
            {FUEL_LABEL[car.fuel] ?? car.fuel} · {TRANSMISSION_LABEL[car.transmission] ?? car.transmission}
          </p>

          <strong className="cars-result-price">{formatPrice(car.price)}</strong>

          <p className="cars-result-location">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            {car.city && car.state ? `${car.city} - ${car.state}` : "Localização não informada"}
          </p>

          <div className="cars-result-badges">
            {car.status === "ativo" && (
              <span className="cars-result-verified">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                Anúncio ativo
              </span>
            )}
            <span className="cars-result-km">{formatKm(car.mileageKm)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/carros/${car.id}`}
      className={`vehicle-card card-dark card-dark-hover group flex flex-col overflow-hidden ${sold ? "opacity-70" : ""}`}
    >
      <div className="vehicle-card-media relative aspect-[16/10] overflow-hidden bg-[#16161c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`${car.brand} ${car.model} ${car.year}`}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${sold ? "grayscale" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12]/80 via-transparent to-transparent" />
        {car.isDemo && (
          <span className="absolute right-3 top-3 rounded-md border border-[#d4af37]/60 bg-[#15120a]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#e7c96c]">
            {image.startsWith("/images/demo/") ? "DEMO · Foto ilustrativa" : "DEMO"}
          </span>
        )}
        {sold && (
          <span className="absolute left-3 top-3 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-400 ring-1 ring-red-500/50">
            Vendido
          </span>
        )}
        {!sold && car.status !== "ativo" && (
          <span className="absolute left-3 top-3 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9b9ba4] ring-1 ring-white/20">
            {({pendente:"Em análise",rejeitado:"Rejeitado",pausado:"Pausado",arquivado:"Arquivado",suspenso:"Suspenso"} as Record<string,string>)[car.status || ""] || "Indisponível"}
          </span>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-[#e8e8e2] backdrop-blur">
            {FUEL_LABEL[car.fuel] ?? car.fuel}
          </span>
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-[#e8e8e2] backdrop-blur">
            {TRANSMISSION_LABEL[car.transmission] ?? car.transmission}
          </span>
        </div>
      </div>

      <div className="vehicle-card-info flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-lg font-bold leading-snug text-[#f4f3ee]">
          {car.brand} {car.model}{" "}
          <span className="font-sans text-sm font-medium text-[#9b9ba4]">{car.year}</span>
        </h3>
        {car.version && <p className="truncate text-xs text-[#9b9ba4]">{car.version}</p>}
        <p className="gold-text font-display text-xl font-bold">{formatPrice(car.price)}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#9b9ba4]">
          <span className="flex items-center gap-1.5">{formatKm(car.mileageKm)}</span>
          <span>{car.city && car.state ? `${car.city}/${car.state}` : "Localização não informada"}</span>
        </div>
      </div>
    </Link>
  );
}
