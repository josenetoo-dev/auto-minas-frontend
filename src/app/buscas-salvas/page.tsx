import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch, getApiToken } from "@/lib/backend";
import SavedSearchList, { type SavedSearch } from "@/components/saved-search-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscas salvas" };
export default async function SavedSearches() {
  await requireUser();
  const token = await getApiToken();
  const searches = await backendFetch<SavedSearch[]>("/v1/buscas-salvas", {}, token || undefined);
  return <main className="mx-auto max-w-4xl px-4 py-10 text-white">
    <Link href="/conta" className="underline">← Minha conta</Link>
    <h1 className="my-6 text-3xl font-bold">Buscas salvas</h1>
    <p className="mb-6 max-w-2xl text-[#c5c2b9]">Guarde os filtros que usa com frequência, por exemplo “automáticos até R$ 60 mil em Belo Horizonte”. Depois, volte a esta página e abra a busca com um toque. Os resultados são consultados novamente; salvar a busca não reserva carros nem envia alertas.</p>
    <SavedSearchList initial={searches} />
  </main>;
}
