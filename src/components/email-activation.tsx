"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailActivation() {
  const router = useRouter();
  const [text, setText] = useState("");

  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(value => Math.max(0,value-1)),1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  useEffect(() => {
    let active = true;
    void fetch("/api/backend/v1/usuario/me/contato/email/situacao", {cache:"no-store"})
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!active || !data?.codigoEnviado) return;
        setRemaining(Math.max(0, Number(data.reenviarEmSegundos) || 0));
        setText("Um código já foi enviado ao seu e-mail. Use esse código ou aguarde para reenviar.");
      }).catch(() => {});
    return () => {active = false;};
  }, []);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(path: "solicitar" | "confirmar", body?: unknown) {
    setBusy(true);
    setError("");
    setText("");
    try {
      const confirming = path === "confirmar";
      const endpoint = confirming
        ? "/api/auth/contact-email/confirm"
        : `/api/backend/v1/usuario/me/contato/email/${path}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = res.status === 204 ? {} : await res.json().catch(() => ({}));
      if (res.status === 503) throw new Error("O envio de e-mail está temporariamente indisponível. Sua conta continua conectada; tente novamente mais tarde.");
      if (res.status === 429) { setRemaining(60); setText("Um código já foi enviado recentemente. Consulte seu e-mail; você poderá reenviar em um minuto."); return; }
      if (!res.ok) throw new Error(json.detail || json.error || "Não foi possível concluir a solicitação.");

      if (confirming) {
        setText("E-mail confirmado.");
        router.replace(json.redirect);
        router.refresh();
      } else {
        setRemaining(60);
        setText("Código enviado. Consulte sua caixa de entrada e a pasta de spam.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-dark space-y-4 border border-amber-500/20 p-6">
      <h2 className="font-display text-2xl font-bold">Confirme seu e-mail</h2>
      <p className="text-sm text-[#9b9ba4]">O cadastro envia um código automaticamente. Consulte o e-mail informado. Confirme seu e-mail para solicitar revisões e publicar veículos.</p>
      <button onClick={() => call("solicitar")} disabled={busy || remaining > 0} className="btn-outline">{remaining > 0 ? `Reenviar em ${remaining}s` : "Enviar código por e-mail"}</button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="input-dark flex-1" placeholder="Código recebido" aria-label="Código de ativação" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} />
        <button disabled={busy || code.length !== 6} onClick={() => call("confirmar", { token: code })} className="btn-gold">Confirmar</button>
      </div>
      {text && <p className="text-sm text-emerald-300">{text}</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
