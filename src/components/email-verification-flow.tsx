"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import HistoryBackButton from "@/components/history-back-button";

export default function EmailVerificationFlow({
  email,
  initiallyVerified,
}: {
  email: string;
  initiallyVerified: boolean;
}) {
  const [verified, setVerified] = useState(initiallyVerified);
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (verified) return;
    let active = true;
    void fetch("/api/backend/v1/usuario/me/contato/email/situacao", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.confirmado === true) {
          setVerified(true);
          return;
        }
        if (data.codigoEnviado) {
          setRemaining(Math.max(0, Number(data.reenviarEmSegundos) || 0));
          setNotice("Um código já foi enviado. Consulte sua caixa de entrada e a pasta de spam.");
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [verified]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = code.padEnd(6, " ").slice(0, 6).split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/\s/g, "").slice(0, 6);
    setCode(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function pasteCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    setCode(digits);
    refs.current[Math.min(digits.length, 6) - 1]?.focus();
  }

  async function requestCode() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/backend/v1/usuario/me/contato/email/solicitar", {
        method: "POST",
      });
      const json = response.status === 204 ? {} : await response.json().catch(() => ({}));

      if (response.status === 429) {
        setRemaining(60);
        setNotice("Um código foi enviado recentemente. Aguarde um minuto antes de solicitar outro.");
        return;
      }
      if (response.status === 503) {
        throw new Error("O envio de e-mail está temporariamente indisponível.");
      }
      if (!response.ok) {
        throw new Error(json.detail || json.error || "Não foi possível enviar o código.");
      }

      setRemaining(60);
      setNotice("Código enviado. Consulte sua caixa de entrada e a pasta de spam.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (code.length !== 6) {
      setError("Digite os 6 dígitos do código.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/contact-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const json = response.status === 204 ? {} : await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Código inválido ou expirado.");
      }

      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="email-verify-screen">
      <HistoryBackButton fallback="/conta" className="flow-back-button" ariaLabel="Voltar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      </HistoryBackButton>

      <header className="flow-brand">
        <span className="flow-brand-mark">AM</span>
        <span>Auto Minas</span>
      </header>

      <div className="flow-car-accent" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/vehicle-illustration.svg" alt="" />
      </div>

      <main className="email-verify-content">
        {!verified ? (
          <>
            <div className="flow-hero-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <rect x="7" y="11" width="30" height="22" rx="4" />
                <path d="m9 14 13 10 13-10" />
                <path d="M31 30v8l6 3 6-3v-8l-6-3-6 3Z" />
                <path d="m34 34 2 2 4-4" />
              </svg>
            </div>

            <h1>Verificar e-mail</h1>
            <p className="flow-lead">Enviamos um código de verificação para seu e-mail:</p>

            <div className="flow-email-pill">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
              <span>{email}</span>
            </div>

            <div className="flow-code-section">
              <label>Código de verificação</label>
              <div className="flow-code-grid" onPaste={(event) => { event.preventDefault(); pasteCode(event.clipboardData.getData("text")); }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(node) => { refs.current[index] = node; }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={code[index] ?? ""}
                    onChange={(event) => setDigit(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !code[index] && index > 0) refs.current[index - 1]?.focus();
                    }}
                    aria-label={`Dígito ${index + 1} do código`}
                  />
                ))}
              </div>
            </div>

            <div className="flow-resend">
              <p>Não recebeu o código?</p>
              <button type="button" disabled={busy || remaining > 0} onClick={requestCode}>
                {remaining > 0 ? `Reenviar código em 00:${String(remaining).padStart(2, "0")}` : "Reenviar código"}
              </button>
            </div>

            {notice && <p className="flow-notice">{notice}</p>}
            {error && <p className="flow-error" role="alert">{error}</p>}

            <button type="button" className="flow-primary-button" onClick={confirmCode} disabled={busy || code.length !== 6}>
              {busy ? "Verificando…" : "Verificar e-mail"}
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : (
          <div className="email-success-state">
            <div className="flow-hero-icon is-success" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <rect x="7" y="11" width="30" height="22" rx="4" />
                <path d="m9 14 13 10 13-10" />
                <circle cx="36" cy="35" r="8" />
                <path d="m32 35 3 3 5-6" />
              </svg>
            </div>

            <h1>E-mail verificado!</h1>
            <p className="flow-lead">Seu e-mail foi confirmado com sucesso.</p>

            <div className="flow-success-card">
              <span>✓</span>
              <p>Sua conta agora está mais segura e pronta para uso.</p>
            </div>

            <Link href="/conta" className="flow-primary-button">
              Continuar <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </main>

      <div className="flow-bottom-glow" aria-hidden="true" />
    </div>
  );
}
