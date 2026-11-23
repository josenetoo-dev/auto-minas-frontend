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
    <SavedSearchList initial={searches} />
  </main>;
}
