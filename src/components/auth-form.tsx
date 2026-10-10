"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function AuthForm({
  next,
  error,
}: {
  next: string;
  error?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pageError =
    error === "google_not_supported"
      ? "O login com Google ainda não é aceito pela API Auto Minas. Use seu e-mail."
      : error === "google_failed"
        ? "Não foi possível concluir o login com o Google. Tente novamente."
        : error === "expired"
          ? "Sua sessão expirou. Entre novamente para continuar."
          : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
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
              : { name, email, phone, password },
          ),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Algo deu errado. Tente novamente.");
        return;
      }
      const redirect = data.redirect && data.redirect.startsWith("/") ? data.redirect : "/conta";
      router.push(redirect);
      router.refresh();
    } catch {
      setFormError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#26262e] bg-[#101014] p-1">
        <button
          type="button"
          onClick={() => { setMode("login"); setFormError(null); }}
          className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
            mode === "login"
              ? "bg-gradient-to-r from-[#f2d87e] via-[#d4af37] to-[#b08d24] text-[#171003] shadow-lg shadow-[#d4af37]/20"
              : "text-[#9b9ba4] hover:text-[#f4f3ee]"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setFormError(null); }}
          className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
            mode === "register"
              ? "bg-gradient-to-r from-[#f2d87e] via-[#d4af37] to-[#b08d24] text-[#171003] shadow-lg shadow-[#d4af37]/20"
              : "text-[#9b9ba4] hover:text-[#f4f3ee]"
          }`}
        >
          Criar conta
        </button>
      </div>

      <div className="card-dark p-7">
        <h1 className="font-display text-2xl font-bold text-[#f4f3ee]">
          {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
        </h1>
        <p className="mt-1 text-sm text-[#9b9ba4]">
          {mode === "login"
            ? "Acesse sua conta para conversar com vendedores e gerenciar seus anúncios."
            : "Cadastre-se para vender seu carro e conversar com vendedores."}
        </p>

        <p className="my-5 text-sm text-[#9b9ba4]">Autenticação segura pela API do Auto Minas. Novas contas precisam confirmar o e-mail.</p>

        {(pageError || formError) && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError ?? pageError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label htmlFor="name" className="label-dark">Nome completo</label>
              <input
                id="name"
                type="text"
                className="input-dark"
                placeholder="Ex.: Carlos Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}
          {mode === "register" && <div><label htmlFor="phone" className="label-dark">Telefone com DDD *</label><input id="phone" className="input-dark" type="tel" placeholder="38999999999" required minLength={10} maxLength={16} value={phone} onChange={e=>setPhone(e.target.value)}/></div>}
          <div>
            <label htmlFor="email" className="label-dark">E-mail</label>
            <input
              id="email"
              type="email"
              className="input-dark"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="label-dark">Senha</label>
            <input
              id="password"
              type="password"
              className="input-dark"
              placeholder={mode === "register" ? "Mínimo 8 caracteres, com letras e números" : "Sua senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#171003]/30 border-t-[#171003]" />
                Aguarde…
              </span>
            ) : mode === "login" ? (
              "Entrar na minha conta"
            ) : (
              "Criar conta e vender meu carro"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#5c5c66]">
          {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setFormError(null); }}
            className="font-bold text-[#f2d87e] hover:underline"
          >
            {mode === "login" ? "Cadastre-se grátis" : "Fazer login"}
          </button>
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-[#26262e] bg-[#0d0d11] px-4 py-3 text-xs text-[#9b9ba4]">Se esqueceu a senha, <a className="text-[#f2d87e] underline" href="/recuperar-senha">solicite a recuperação por e-mail.</a></div>
    </div>
  );
}
