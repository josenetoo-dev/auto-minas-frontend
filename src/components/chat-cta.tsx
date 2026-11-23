"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

/** A API Spring abre conversas somente vinculadas a propostas comerciais. */
export default function ChatCta({
  carId,
  price,
  loggedIn,
  nextPath,
  variant = "default",
}: {
  carId: number;
  price: number;
  loggedIn: boolean;
  nextPath: string;
  variant?: "default" | "detail";
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(price));
  const [message, setMessage] = useState("Tenho interesse no veículo e gostaria de negociar.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const attempt = useRef<{ payload: string; requestId: string } | null>(null);
  const sending = useRef(false);

  if (!loggedIn) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(nextPath)}`}
        className={variant === "detail" ? "vehicle-chat-button" : "btn-gold w-full py-3"}
      >
        {variant === "detail" && (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" /></svg>
        )}
        {variant === "detail" ? "Conversar" : "Entrar para enviar proposta"}
      </a>
    );
  }

  async function send() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const proposal = { carId, price: Number(value), message: message.trim() };
      const payload = JSON.stringify(proposal);
      if (attempt.current?.payload !== payload) {
        attempt.current = { payload, requestId: crypto.randomUUID() };
      }
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...proposal, requestId: attempt.current.requestId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar proposta");
      router.push(`/chat/${json.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (variant === "detail") {
    return (
      <div className="vehicle-chat-cta">
        <button type="button" className="vehicle-chat-button" onClick={() => setOpen((value) => !value)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" /></svg>
          Conversar
        </button>

        {open && (
          <div className="vehicle-offer-panel">
            <p>Para iniciar o chat, envie uma proposta. Preço anunciado: <strong>{formatPrice(price)}</strong>.</p>
            <label htmlFor="detailOfferValue">Sua proposta (R$)</label>
            <input
              id="detailOfferValue"
              type="number"
              min="1"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <label htmlFor="detailOfferMessage">Mensagem inicial</label>
            <textarea
              id="detailOfferMessage"
              required
              maxLength={255}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || Number(value) <= 0 || !message.trim()}
              className="vehicle-offer-submit"
            >
              {busy ? "Enviando…" : "Enviar proposta e abrir negociação"}
            </button>
            <p className="text-sm">Antes de negociar, confirme quem vende e não transfira dinheiro a terceiros. <Link href="/seguranca/encontro" className="underline">Checklist de encontro seguro</Link>.</p>
            {error && <p role="alert" className="vehicle-offer-error">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#9b9ba4]">
        Para abrir uma negociação, envie uma proposta de valor ao vendedor. Preço anunciado:{" "}
        <strong className="text-[#f2d87e]">{formatPrice(price)}</strong>.
      </p>
      <label htmlFor="offerValue" className="label-dark">Valor que deseja propor (R$)</label>
      <input id="offerValue" type="number" min="1" required value={value} onChange={(e) => setValue(e.target.value)} className="input-dark" />
      <label htmlFor="offerMessage" className="label-dark">Mensagem inicial</label>
      <textarea id="offerMessage" required maxLength={255} className="input-dark min-h-20" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="button" onClick={send} disabled={busy || Number(value) <= 0 || !message.trim()} className="btn-gold w-full py-3">
        {busy ? "Enviando…" : "Enviar proposta e abrir negociação"}
      </button>
      <p className="text-sm text-[#b7b3a9]">Confira identidade e documentação; evite pagamentos antecipados a terceiros. <Link href="/seguranca/encontro" className="underline">Veja o checklist</Link>.</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
