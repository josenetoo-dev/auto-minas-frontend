"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/recovery.css";

type Phase = 0 | 1 | 2 | 3;

function FlowIcon({ phase }: { phase: Phase }) {
  if (phase === 2) {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="14" y="21" width="20" height="17" rx="4" />
        <path d="M18 21v-5a6 6 0 0 1 12 0v5" />
        <circle cx="24" cy="29" r="1.5" />
      </svg>
    );
  }
  if (phase === 3) {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="16" />
        <path d="m16 24 5 5 11-12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="8" y="12" width="30" height="22" rx="4" />
      <path d="m10 15 13 10 13-10" />
      {phase === 1 && (
        <>
          <rect x="25" y="28" width="17" height="10" rx="2" />
          <path d="M29 33h1M33 33h1M37 33h1" />
        </>
      )}
    </svg>
  );
}

export default function ResetPassword() {
  const [phase, setPhase] = useState<Phase>(0);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/backend/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = response.status === 204 || response.status === 202
        ? {}
        : await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Não foi possível enviar o código.");
      }

      setRemaining(60);
      setPhase(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/backend/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const json = response.status === 204 || response.status === 202
        ? {}
        : await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Não foi possível alterar a senha.");
      }

      setPhase(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = token.padEnd(6, " ").slice(0, 6).split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/\s/g, "").slice(0, 6);
    setToken(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function pasteCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    setToken(digits);
    refs.current[Math.min(digits.length, 6) - 1]?.focus();
  }

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean) && password === confirmPassword;

  const title =
    phase === 0 ? "Recuperar senha" :
    phase === 1 ? "Confirmar código" :
    phase === 2 ? "Definir nova senha" :
    "Senha alterada!";

  const subtitle =
    phase === 0 ? "Informe seu e-mail para receber o código de redefinição." :
    phase === 1 ? "Digite o código de 6 dígitos enviado para seu e-mail." :
    phase === 2 ? "Crie uma nova senha segura para sua conta." :
    "Sua senha foi atualizada com sucesso.";

  return (
    <div className="recovery-reference-screen">
      {phase === 0 ? (
        <HistoryBackButton fallback="/login" className="flow-back-button" ariaLabel="Voltar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </HistoryBackButton>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError("");
            setPhase((value) => Math.max(0, value - 1) as Phase);
          }}
          className="flow-back-button"
          aria-label="Voltar para a etapa anterior"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}

      <header className="flow-brand">
        <span className="flow-brand-mark">AM</span>
        <span>Auto Minas</span>
      </header>

      <main className="recovery-reference-content">
        <div className={`flow-hero-icon ${phase === 3 ? "is-success" : ""}`} aria-hidden="true">
          <FlowIcon phase={phase} />
        </div>

        <h1>{title}</h1>
        <p className="flow-lead">{subtitle}</p>

        {phase === 0 && (
          <form onSubmit={(event) => { event.preventDefault(); void requestCode(); }} className="recovery-form">
            <label>
              <span>E-mail</span>
              <div className="flow-input">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </label>

            {error && <p className="flow-error" role="alert">{error}</p>}

            <button type="submit" className="flow-primary-button" disabled={busy || !email.trim()}>
              {busy ? "Enviando…" : "Enviar código"} <span aria-hidden="true">→</span>
            </button>

            <Link href="/login" className="flow-secondary-link">← Voltar para o login</Link>
          </form>
        )}

        {phase === 1 && (
          <div className="recovery-code-step">
            <div className="flow-code-grid" onPaste={(event) => { event.preventDefault(); pasteCode(event.clipboardData.getData("text")); }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(node) => { refs.current[index] = node; }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={token[index] ?? ""}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !token[index] && index > 0) refs.current[index - 1]?.focus();
                  }}
                  aria-label={`Dígito ${index + 1} do código`}
                />
              ))}
            </div>

            <div className="flow-resend">
              <p>Não recebeu o código?</p>
              <button type="button" disabled={busy || remaining > 0} onClick={() => void requestCode()}>
                {remaining > 0 ? `Reenviar em 00:${String(remaining).padStart(2, "0")}` : "Reenviar código"}
              </button>
            </div>

            {error && <p className="flow-error" role="alert">{error}</p>}

            <button type="button" className="flow-primary-button" disabled={token.length !== 6} onClick={() => { setError(""); setPhase(2); }}>
              Continuar <span aria-hidden="true">→</span>
            </button>

            <button type="button" className="flow-secondary-link" onClick={() => setPhase(0)}>← Voltar</button>
          </div>
        )}

        {phase === 2 && (
          <form onSubmit={(event) => { event.preventDefault(); void resetPassword(); }} className="recovery-form">
            <label>
              <span>Nova senha</span>
              <div className="flow-input">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="flow-eye-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{!showPassword && <path d="M4 4l16 16" />}</svg>
                </button>
              </div>
            </label>

            <ul className="password-rule-list">
              <li className={passwordRules.length ? "is-valid" : ""}>✓ Mínimo de 8 caracteres</li>
              <li className={passwordRules.upper ? "is-valid" : ""}>✓ Ao menos 1 letra maiúscula</li>
              <li className={passwordRules.number ? "is-valid" : ""}>✓ Ao menos 1 número</li>
              <li className={passwordRules.special ? "is-valid" : ""}>✓ Ao menos 1 caractere especial</li>
            </ul>

            <label>
              <span>Confirmar nova senha</span>
              <div className="flow-input">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="flow-eye-button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{!showConfirm && <path d="M4 4l16 16" />}</svg>
                </button>
              </div>
            </label>

            {error && <p className="flow-error" role="alert">{error}</p>}

            <button type="submit" className="flow-primary-button" disabled={busy || !passwordValid}>
              {busy ? "Alterando…" : "Alterar senha"} <span aria-hidden="true">✓</span>
            </button>
          </form>
        )}

        {phase === 3 && (
          <div className="recovery-success-step">
            <div className="flow-success-card">
              <span>✓</span>
              <p>Sua nova senha já está ativa. Faça login novamente para continuar.</p>
            </div>
            <Link href="/login" className="flow-primary-button">Ir para o login <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </main>

      <div className="flow-bottom-glow" aria-hidden="true" />
    </div>
  );
}
