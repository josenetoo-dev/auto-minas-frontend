import Link from "next/link";
import Image from "next/image";
import { carById, type CarData } from "@/lib/car";
import { backendFetch, getApiToken } from "@/lib/backend";
import type { VerificationSummary } from "@/lib/verification-summary";
import { HISTORY_QUESTIONS, HISTORY_OPTIONS } from "@/lib/vehicle-history";
import { formatKm, formatPrice } from "@/lib/format";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/constants";
import CompareResetButton from "@/components/compare-reset-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comparar veículos" };
type Entry = { car: CarData; verification: VerificationSummary | null };

function reviewed(value?: { analisadaManualmente: boolean; analisadaEm: string | null }) {
  if (!value?.analisadaManualmente) return "Sem análise confirmada";
  const date = value.analisadaEm ? new Date(value.analisadaEm) : null;
  return date && !Number.isNaN(date.getTime())
    ? `Analisada em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(date)}`
    : "Analisada; data não informada";
}

export default async function Compare({ searchParams }: { searchParams: Promise<{ ids?: string | string[] }> }) {
  const query = await searchParams;
  const raw = typeof query.ids === "string" ? query.ids : "";
  const parts = raw.split(",");
  const valid = raw.length <= 80 && parts.length <= 2 && parts.every(part => /^[1-9]\d{0,15}$/.test(part) && Number.isSafeInteger(Number(part)));
  const ids = valid ? [...new Set(parts.map(Number))] : [];
  const token = await getApiToken();
  const entries: Entry[] = (await Promise.all(ids.map(async id => {
    try {
      const car = await carById(id, token || undefined);
      if (car.statusApi !== "ATIVO") return null;
      const verification = car.isDemo ? null : await backendFetch<VerificationSummary>(`/v1/anuncio/${id}/verificacoes`, {}, token || undefined).catch(() => null);
      return { car, verification };
    } catch { return null; }
  }))).filter((entry): entry is Entry => entry !== null);

  const rows: { label: string; value: (entry: Entry) => string }[] = [
    { label: "Preço", value: ({ car }) => formatPrice(car.price) },
    { label: "Ano", value: ({ car }) => String(car.year) },
    { label: "Quilometragem", value: ({ car }) => formatKm(car.mileageKm) },
    { label: "Combustível", value: ({ car }) => FUEL_LABEL[car.fuel] ?? car.fuel },
    { label: "Câmbio", value: ({ car }) => TRANSMISSION_LABEL[car.transmission] ?? car.transmission },
    { label: "Localização", value: ({ car }) => car.city && car.state ? `${car.city} - ${car.state}` : "Não informada" },
    { label: "Identidade do vendedor", value: ({ car, verification }) => car.isDemo ? "Não se aplica a DEMO" : reviewed(verification?.vendedor) },
    { label: "Documento do veículo", value: ({ car, verification }) => car.isDemo ? "Não se aplica a DEMO" : reviewed(verification?.veiculo) },
    ...HISTORY_QUESTIONS.map(({ key, label }) => ({
      label: `${label} (declarado)`,
      value: ({ car }: Entry) => HISTORY_OPTIONS.find(option => option.value === car.vehicleHistory?.[key])?.label ?? "Não informado",
    })),
  ];

  return <main className="mx-auto max-w-6xl px-4 py-10 text-white">
    <Link href="/carros" className="underline">← Explorar carros</Link>
    <h1 className="my-6 text-3xl font-bold">Comparar dois veículos</h1>
    <p className="mb-6 text-sm text-[#c5c2b9]">Escolha um par para conferir os dados lado a lado. Histórico é declaração do vendedor; verificações só aparecem quando analisadas. Carros DEMO são ilustrativos e não estão à venda.</p>
    {!valid && raw && <p role="alert" className="mb-4 text-red-300">Selecione até dois anúncios válidos.</p>}
    {entries.length === 0 ? <p>Nenhum anúncio disponível para comparação. Abra um veículo e escolha “Adicionar à comparação”.</p>
      : <div className="space-y-4" role="region" aria-label="Comparação de dois veículos">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {entries.map(({ car }) => <Link key={car.id} href={`/carros/${car.id}`} className="min-w-0 rounded-xl border border-white/20 bg-[#171716] p-3 underline underline-offset-4 sm:p-5">
            <Image src={car.images[0] ?? "/images/car-placeholder.svg"} alt={`${car.brand} ${car.model}`} width={400} height={240} className="mb-3 h-28 w-full rounded-lg object-cover sm:h-44" />
            <strong className="block break-words text-sm sm:text-lg">{car.brand} {car.model} {car.year}</strong>
            {car.isDemo && <span className="mt-2 inline-block rounded border border-amber-300/50 px-2 py-1 text-xs no-underline">DEMO · negociação simulada</span>}
          </Link>)}
          {entries.length === 1 && <div className="flex min-h-40 flex-col justify-center rounded-xl border border-dashed border-white/30 p-3 text-sm sm:p-5">
            <p>Escolha o segundo veículo no catálogo.</p><Link href="/carros" className="mt-3 underline">Explorar carros</Link>
          </div>}
        </div>
        <dl className="overflow-hidden rounded-xl border border-white/20 bg-[#171716]">
          {rows.map(row => <div key={row.label} className="border-t border-white/15 p-3 first:border-t-0 sm:p-4">
            <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#d4af37]">{row.label}</dt>
            <dd className="grid grid-cols-2 gap-2 text-sm sm:gap-4 sm:text-base">
              {entries.map(entry => <span key={entry.car.id} className="min-w-0 break-words rounded-lg bg-white/5 p-2 sm:p-3">{row.value(entry)}</span>)}
              {entries.length === 1 && <span className="rounded-lg border border-dashed border-white/20 p-2 text-[#c5c2b9] sm:p-3">—</span>}
            </dd>
          </div>)}
        </dl>
        <CompareResetButton />
      </div>}
  </main>;
}
