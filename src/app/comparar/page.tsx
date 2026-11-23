import Link from "next/link";
import Image from "next/image";
import { carById, type CarData } from "@/lib/car";
import { backendFetch, getApiToken } from "@/lib/backend";
import type { VerificationSummary } from "@/lib/verification-summary";
import { HISTORY_QUESTIONS, HISTORY_OPTIONS } from "@/lib/vehicle-history";
import { formatKm, formatPrice } from "@/lib/format";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/constants";

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
  const valid = raw.length <= 80 && parts.length <= 3 && parts.every(part => /^[1-9]\d{0,15}$/.test(part) && Number.isSafeInteger(Number(part)));
  const ids = valid ? [...new Set(parts.map(Number))] : [];
  const token = await getApiToken();
  const entries: Entry[] = (await Promise.all(ids.map(async id => {
    try {
      const car = await carById(id, token || undefined);
      if (car.statusApi !== "ATIVO" || car.isDemo) return null;
      const verification = await backendFetch<VerificationSummary>(`/v1/anuncio/${id}/verificacoes`, {}, token || undefined).catch(() => null);
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
    { label: "Identidade do vendedor", value: ({ verification }) => reviewed(verification?.vendedor) },
    { label: "Documento do veículo", value: ({ verification }) => reviewed(verification?.veiculo) },
    ...HISTORY_QUESTIONS.map(({ key, label }) => ({
      label: `${label} (declarado)`,
      value: ({ car }: Entry) => HISTORY_OPTIONS.find(option => option.value === car.vehicleHistory?.[key])?.label ?? "Não informado",
    })),
  ];

  return <main className="mx-auto max-w-6xl px-4 py-10 text-white">
    <Link href="/carros" className="underline">← Explorar carros</Link>
    <h1 className="my-6 text-3xl font-bold">Comparar veículos</h1>
    <p className="mb-6 text-sm text-[#c5c2b9]">Histórico informado pelo vendedor é declaração. Verificações aparecem somente quando analisadas.</p>
    {!valid && raw && <p role="alert" className="mb-4 text-red-300">Selecione até três anúncios válidos.</p>}
    {entries.length === 0 ? <p>Nenhum anúncio disponível para comparação. Abra um veículo e use “Adicionar à comparação”.</p>
      : <div className="overflow-x-auto rounded-xl border border-white/20" role="region" aria-label="Tabela comparativa" tabIndex={0}>
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">Comparação de até três anúncios ativos</caption>
          <thead><tr><th scope="col" className="w-40 p-4">Característica</th>{entries.map(({ car }) => <th scope="col" key={car.id} className="min-w-56 p-4 align-top">
            <Link href={`/carros/${car.id}`} className="block underline underline-offset-4">
              <Image src={car.images[0] ?? "/images/car-placeholder.svg"} alt={`${car.brand} ${car.model}`} width={280} height={160} className="mb-3 h-36 w-full rounded-lg object-cover" />
              {car.brand} {car.model} {car.year}
            </Link>
          </th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.label} className="border-t border-white/15"><th scope="row" className="p-4 font-semibold">{row.label}</th>
            {entries.map(entry => <td key={entry.car.id} className="p-4 align-top">{row.value(entry)}</td>)}
          </tr>)}</tbody>
        </table>
      </div>}
  </main>;
}
