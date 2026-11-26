import { NextResponse } from "next/server";
import { searchPublicCars, type CarData } from "@/lib/car";

export const dynamic = "force-dynamic";
export type Suggestion = { kind: "marca" | "modelo" | "cidade"; value: string };
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 40 || !/^[\p{L}\p{N} .'-]+$/u.test(q))
    return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    const [names, cities] = await Promise.all([
      searchPublicCars({ q, tipo: "CARRO" }),
      searchPublicCars({ city: q, tipo: "CARRO" }),
    ]);
    const matches = (cars: CarData[]) => cars.filter(car => car.statusApi === "ATIVO");
    const unique = new Map<string, Suggestion>();
    function add(kind: Suggestion["kind"], value: string) {
      if (!value || unique.size >= 12 || !value.toLocaleLowerCase("pt-BR").includes(q.toLocaleLowerCase("pt-BR"))) return;
      unique.set(`${kind}:${value.toLocaleLowerCase("pt-BR")}`, { kind, value });
    }
    for (const car of matches(names.cars)) { add("marca", car.brand); add("modelo", car.model); }
    for (const car of matches(cities.cars)) add("cidade", car.city);
    const suggestions = [...unique.values()].sort((a, b) => {
      const aPrefix = a.value.toLocaleLowerCase("pt-BR").startsWith(q.toLocaleLowerCase("pt-BR")) ? 0 : 1;
      const bPrefix = b.value.toLocaleLowerCase("pt-BR").startsWith(q.toLocaleLowerCase("pt-BR")) ? 0 : 1;
      return aPrefix - bPrefix || a.value.localeCompare(b.value, "pt-BR");
    }).slice(0, 8);
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
