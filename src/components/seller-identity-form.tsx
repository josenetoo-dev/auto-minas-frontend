"use client";

import { useEffect, useState } from "react";

type Profile = { nomeCompleto: string; cpfMascarado: string | null; identificacaoInformada: boolean };
type Props = { onComplete?: () => void };

export default function SellerIdentityForm({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/commercial/profile").then(async response => {
      if (!response.ok) throw new Error("Não foi possível carregar seus dados.");
      return response.json() as Promise<Profile>;
    }).then(profile => {
      if (!active) return;
      setName(profile.nomeCompleto ?? "");
      setSaved(profile.identificacaoInformada);
      if (profile.identificacaoInformada) onComplete?.();
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Falha ao carregar dados."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [onComplete]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/commercial/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nomeCompleto: name, cpf: cpf.replace(/\D/g, "") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível proteger os dados.");
      setSaved(true); setCpf(""); onComplete?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha de conexão."); }
    finally { setBusy(false); }
  }

  if (busy && !saved) return <section className="card-dark p-5 text-sm text-[#a9a9b2]" aria-busy="true">Carregando identificação…</section>;

  return <section className="card-dark space-y-4 p-5 sm:p-6">
    <div><p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Etapa 1 · Identificação</p><h2 className="font-display mt-2 text-xl font-bold text-[#f4f3ee]">Dados do anunciante</h2><p className="mt-2 text-sm leading-6 text-[#a9a9b2]">O CPF é usado para identificação e contratação. Ele é protegido no backend e não retorna em texto aberto.</p></div>
    {saved ? <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4 text-sm text-emerald-200">Identificação cadastrada. CPF armazenado com proteção criptográfica.{" "}<a href="/verificacoes" className="underline underline-offset-4">Enviar documentos para análise humana</a></div> : <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-[#c3c3cc]">Nome completo<input autoComplete="name" required minLength={3} maxLength={160} value={name} onChange={event => setName(event.target.value)} className="input-dark mt-2" /></label>
      <label className="text-sm text-[#c3c3cc]">CPF<input autoComplete="off" inputMode="numeric" required maxLength={14} value={cpf} onChange={event => setCpf(event.target.value.replace(/[^\d.\-/]/g, "").slice(0, 14))} placeholder="000.000.000-00" className="input-dark mt-2" /></label>
      <button disabled={busy} className="btn-gold min-h-11 sm:col-span-2 sm:justify-self-start">{busy ? "Protegendo dados…" : "Salvar identificação"}</button>
    </form>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </section>;
}
