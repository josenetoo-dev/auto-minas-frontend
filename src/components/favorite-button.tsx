"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ id, initial, signedIn }: { id: number; initial: boolean; signedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function toggle() {
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/carros/${id}`)}`); return; }
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/favorites/${id}`, { method: saved ? "DELETE" : "PUT" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Não foi possível atualizar favoritos.");
      setSaved(!saved);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar favoritos."); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" className={`vehicle-detail-icon-button vehicle-favorite-button ${saved ? "is-saved" : ""}`} onClick={toggle} disabled={busy}
      aria-label={saved ? "Remover dos favoritos" : "Adicionar aos favoritos"} aria-pressed={saved}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
    {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
  </>;
}
