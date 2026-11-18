"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

function FieldIcon({ type }: { type: "user" | "email" | "phone" | "lock" }) {
  if (type === "user") return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
  if (type === "email") return <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>;
  if (type === "phone") return <path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2Z" />;
  return <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>;
}

export default function AuthForm({
  next,
  error,
  initialMode,
}: {
  next: string;
  error?: string;
  initialMode: Mode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const pageError =
    error === "google_not_supported"
      ? "O login com Google ainda não está integrado."
      : error === "google_failed"
        ? "Não foi possível concluir o login com o Google."
        : error === "expired"
          ? "Sua sessão expirou. Entre novamente para continuar."
          : null;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const remembered = window.localStorage.getItem("auto-minas-login-email");
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, []);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setFormError(null);
    setPassword("");
    setConfirmPassword("");
    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === "register") params.set("mode", "register");
    else params.delete("mode");
    router.replace(`/login${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function futureOAuth(provider: "Google" | "GitHub") {
    setFormError(`Entrar com ${provider} já está previsto na interface, mas a integração OAuth será adicionada futuramente.`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (mode === "register" && password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email, password, next }
              : { name, email, phone, password, next, termsAccepted },
          ),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Algo deu errado. Tente novamente.");
        return;
      }

      if (mode === "login") {
        if (rememberEmail) window.localStorage.setItem("auto-minas-login-email", email.trim());
        else window.localStorage.removeItem("auto-minas-login-email");
      }

      window.location.assign(data.redirect || "/");
    } catch {
      setFormError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-reference-card">
      {(pageError || formError) && (
        <div className="auth-reference-error" role="alert">
          {formError ?? pageError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-reference-form">
        {mode === "register" && (
          <label>
            <span>Nome completo</span>
            <div className="auth-reference-input">
              <svg viewBox="0 0 24 24" aria-hidden="true"><FieldIcon type="user" /></svg>
              <input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
          </label>
        )}

        <label>
          <span>E-mail</span>
          <div className="auth-reference-input">
            <svg viewBox="0 0 24 24" aria-hidden="true"><FieldIcon type="email" /></svg>
            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </label>

        {mode === "register" && (
          <label>
            <span>Telefone</span>
            <div className="auth-reference-input">
              <svg viewBox="0 0 24 24" aria-hidden="true"><FieldIcon type="phone" /></svg>
              <input
                id="phone"
                type="tel"
                placeholder="(31) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
                maxLength={16}
                autoComplete="tel"
              />
            </div>
          </label>
        )}

        <label>
          <span>Senha</span>
          <div className="auth-reference-input">
            <svg viewBox="0 0 24 24" aria-hidden="true"><FieldIcon type="lock" /></svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "register" ? "Crie uma senha" : "Digite sua senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button type="button" className="auth-eye-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{!showPassword && <path d="M4 4l16 16" />}</svg>
            </button>
          </div>
          {mode === "register" && <small>Mínimo de 8 caracteres, com letras e números.</small>}
        </label>

        {mode === "register" && (
          <label>
            <span>Confirmar senha</span>
            <div className="auth-reference-input">
              <svg viewBox="0 0 24 24" aria-hidden="true"><FieldIcon type="lock" /></svg>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="auth-eye-button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{!showConfirmPassword && <path d="M4 4l16 16" />}</svg>
              </button>
            </div>
          </label>
        )}

        {mode === "login" && (
          <div className="auth-reference-options">
            <label className="auth-reference-check">
              <input type="checkbox" checked={rememberEmail} onChange={(e) => setRememberEmail(e.target.checked)} />
              <span>Lembrar meu e-mail</span>
            </label>
            <Link href="/recuperar-senha">Esqueceu sua senha?</Link>
          </div>
        )}

        {mode === "register" && (
          <label className="auth-reference-terms">
            <input type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
            <span>
              Li e concordo com os <Link href="/termos" target="_blank">Termos de Uso</Link> e a{" "}
              <Link href="/privacidade" target="_blank">Política de Privacidade</Link> do Auto Minas.
            </span>
          </label>
        )}

        <button type="submit" className="auth-reference-submit" disabled={loading}>
          {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="auth-reference-divider">
        <span />
        <p>{mode === "login" ? "Ou continue com" : "Ou crie sua conta com"}</p>
        <span />
      </div>

      <div className="auth-oauth-stack">
        <button type="button" onClick={() => futureOAuth("Google")} className="auth-oauth-button">
          <span className="auth-google-mark" aria-hidden="true">G</span>
          {mode === "login" ? "Entrar com Google" : "Continuar com Google"}
        </button>
        <button type="button" onClick={() => futureOAuth("GitHub")} className="auth-oauth-button">
          <svg className="auth-github-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.88c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.82a9.5 9.5 0 0 1 2.5.34c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>
          </svg>
          {mode === "login" ? "Entrar com GitHub" : "Continuar com GitHub"}
        </button>
      </div>

      <p className="auth-reference-switch">
        {mode === "login" ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
        <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Criar conta" : "Fazer login"}
        </button>
      </p>
    </section>
  );
}
