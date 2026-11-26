"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./logo";

export type HeaderUser = {
  name: string;
  avatarUrl: string | null;
  role: "USER" | "REVIEWER" | "ADMIN";
};

const NAV = [
  { href: "/", label: "Início" },
  { href: "/carros", label: "Comprar" },
  { href: "/planos", label: "Como anunciar" },
  { href: "/vender", label: "Anunciar" },
  { href: "/chat", label: "Negociações", needsAuth: true },
  { href: "/conta", label: "Conta", needsAuth: true },
];

function Avatar({ name, url, className = "h-8 w-8" }: { name: string; url: string | null; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} referrerPolicy="no-referrer" className={`${className} rounded-full object-cover ring-1 ring-[#d4af37]/60`} />;
  }
  return (
    <span
      className={`${className} grid place-items-center rounded-full bg-gradient-to-br from-[#f2d87e] to-[#a8842a] text-[11px] font-bold text-[#171003]`}
    >
      {initials || "U"}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notice, setNotice] = useState("");

  const hidden = pathname === "/login" || pathname === "/recuperar-senha" || pathname === "/verificar-email" || pathname === "/vender" || pathname === "/meus-anuncios" || /^\/meus-anuncios\/\d+$/.test(pathname) || pathname === "/chat" || /^\/chat\/\d+$/.test(pathname) || pathname === "/planos" || pathname === "/assinatura" || pathname === "/vender/planos" || pathname === "/verificacoes" || /^\/perfil\/\d+$/.test(pathname) || pathname === "/conta" || pathname === "/conta/editar" || pathname === "/moderacao" || pathname.startsWith("/moderacao/") || pathname === "/termos" || pathname === "/privacidade" || pathname.startsWith("/privacidade/") || pathname === "/cookies" || pathname === "/legal" || pathname === "/reembolsos" || pathname === "/feira" || /^\/vender\/editar\/\d+$/.test(pathname) || /^\/carros\/\d+$/.test(pathname);

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { user: null })
      .then((body) => {
        if (!cancelled) setUser(body.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => { cancelled = true; };
  }, [hidden]);

  const accountName = user?.name;
  useEffect(() => {
    if (!accountName) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let previous:Record<string,number>|null = null;
    async function refresh() {
      try {
        if(document.visibilityState !== "visible") return;
        const response = await fetch("/api/backend/v1/proposta/mensagens-nao-lidas",{cache:"no-store"});
        if (!response.ok || stopped) return;
        const counts:Record<string,number> = await response.json();
        if(stopped) return;
        const total = Object.values(counts).reduce((sum,n)=>sum+n,0);
        const last = previous;
        const added = last ? Object.entries(counts).reduce((sum,[id,n])=>sum+Math.max(0,n-(last[id]??0)),0) : 0;
        previous = counts;
        setUnreadCount(total);
        if (added) setNotice(added===1?"Você recebeu uma nova mensagem.":`Você recebeu ${added} novas mensagens.`);
        if (!total) setNotice("");
      } catch { /* A próxima consulta recupera a contagem persistida. */ }
      finally { if(!stopped)timer=setTimeout(refresh,20000); }
    }
    void refresh();
    return ()=>{stopped=true;clearTimeout(timer);};
  },[accountName]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const accountToggle = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (menuOpen) mobileToggle.current?.focus();
        if (userOpen) accountToggle.current?.focus();
        setMenuOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [menuOpen, userOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (hidden) return null;

  if (pathname === "/" || pathname === "/carros") {
    return (
      <header className="home-topbar">
        <div className="home-topbar-inner">
          <Logo size="lg" compactOnMobile />

          <div className="home-topbar-actions">
            <Link href={user ? "/chat" : "/login?next=%2Fchat"} className="home-notification-button" aria-label="Negociações">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              {unreadCount > 0 && <span className="home-notification-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <button
              type="button"
              ref={mobileToggle}
              className="home-menu-button"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="home-mobile-menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="home-mobile-menu" className="home-menu-panel" aria-label="Menu da página inicial">
            {NAV.map((item) => {
              if (item.needsAuth && !user) return null;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
            {!user && <Link href="/login" onClick={() => setMenuOpen(false)}>Entrar</Link>}
            {user && <Link href="/meus-anuncios" onClick={() => setMenuOpen(false)}>Meus anúncios</Link>}
            {user && user.role !== "USER" && <Link href="/moderacao" onClick={() => setMenuOpen(false)}>{user.role === "ADMIN" ? "Administração" : "Moderação"}</Link>}
            {user && <button type="button" onClick={logout}>Sair</button>}
          </nav>
        )}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#26262e]/80 bg-[#08080a]/90 backdrop-blur-xl">
      {/* Faixa dourada superior */}
      <div className="h-[3px] bg-gradient-to-r from-[#8a6d1c] via-[#d4af37] to-[#8a6d1c]" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:gap-4">
        <Logo compactOnMobile />

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {NAV.map((item) => {
            if (item.needsAuth && !user) return null;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold xl:px-3 xl:text-sm transition-all ${
                  active
                    ? "text-[#f2d87e] bg-[#d4af37]/10"
                    : "text-[#9b9ba4] hover:text-[#f4f3ee] hover:bg-white/5"
                }`}
              >
                {item.label}
                {item.href === "/chat" && unreadCount > 0 && (
                  <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gradient-to-br from-[#f2d87e] to-[#b08d24] px-1 text-[10px] font-bold text-[#171003]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span
                  className={`absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-[#f2d87e] to-[#a8842a] transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                ref={accountToggle}
                aria-label={userOpen ? "Fechar menu da conta" : "Abrir menu da conta"}
                aria-expanded={userOpen}
                aria-controls="auto-minas-account-menu"
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-[#26262e] bg-[#101014] py-1 pl-1 pr-3 transition-colors hover:border-[#d4af37]/60"
              >
                <Avatar name={user.name} url={user.avatarUrl} />
                <span className="hidden max-w-20 truncate text-sm font-medium text-[#f4f3ee] sm:block xl:max-w-32">
                  {user.name.split(" ")[0]}
                </span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#9b9ba4]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {userOpen && (
                <div id="auto-minas-account-menu" className="absolute right-0 z-50 mt-2 w-[min(15rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#26262e] bg-[#101014] shadow-2xl shadow-black/60 animate-fade-up">
                  <div className="border-b border-[#26262e] px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[#f4f3ee]">{user.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-[#d4af37]">Minha conta</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/conta"
                      onClick={() => setUserOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#9b9ba4] hover:bg-white/5 hover:text-[#f4f3ee]"
                    >Minha conta e verificações</Link>
                    <Link
                      href="/meus-anuncios"
                      onClick={() => setUserOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive("/meus-anuncios") ? "bg-[#d4af37]/10 text-[#f2d87e]" : "text-[#9b9ba4] hover:bg-white/5 hover:text-[#f4f3ee]"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M4 11h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5a2 2 0 1 1-4 0h-5a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
                      </svg>
                      Meus anúncios
                    </Link>
                    {user.role !== "USER" && (
                      <Link
                        href="/moderacao"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f2d87e] transition-colors hover:bg-[#d4af37]/10"
                      >
                        <span className="grid h-4 w-4 place-items-center">⌘</span>
                        {user.role === "ADMIN" ? "Administração" : "Moderação"}
                      </Link>
                    )}
                    <Link
                      href="/vender"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9b9ba4] transition-colors hover:bg-white/5 hover:text-[#f4f3ee]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Vender meu carro
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/90 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                isActive("/login")
                  ? "bg-gradient-to-r from-[#f2d87e] via-[#d4af37] to-[#b08d24] text-[#171003]"
                  : "border border-[#d4af37]/60 text-[#f2d87e] hover:bg-[#d4af37]/10"
              }`}
            >
              Entrar
            </Link>
          )}

          {/* Hamburguer mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#26262e] text-[#f4f3ee] lg:hidden"
            ref={mobileToggle}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="auto-minas-mobile-menu"
            type="button"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav id="auto-minas-mobile-menu" aria-label="Navegação para celular" className="nice-scroll max-h-[min(70dvh,540px)] overflow-y-auto border-t border-[#26262e] bg-[#0c0c10] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden animate-fade-up">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              if (item.needsAuth && !user) return null;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setMenuOpen(false); setUserOpen(false); }}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
                    active ? "bg-[#d4af37]/10 text-[#f2d87e]" : "text-[#9b9ba4]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.href === "/chat" && unreadCount > 0 && (
                      <span className="rounded-full bg-[#d4af37] px-1.5 text-[10px] font-bold text-[#171003]">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />}
                </Link>
              );
            })}
            {user && user.role !== "USER" && (
              <Link
                href="/moderacao"
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${isActive("/moderacao") ? "bg-[#d4af37]/10 text-[#f2d87e]" : "text-[#f2d87e]"}`}
                onClick={() => { setMenuOpen(false); setUserOpen(false); }}
              >
                {user.role === "ADMIN" ? "Administração" : "Moderação"}
              </Link>
            )}
            {user && (
              <Link
                href="/meus-anuncios"
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  isActive("/meus-anuncios") ? "bg-[#d4af37]/10 text-[#f2d87e]" : "text-[#9b9ba4]"
                }`}
              >
                Meus anúncios
              </Link>
            )}
            {user && (
              <button
                onClick={logout}
                className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-400"
              >
                Sair
              </button>
            )}
          </div>
        </nav>
      )}
      {user && notice && <div role="status" className="flex items-center justify-center gap-3 bg-[#332a15] px-3 py-2 text-sm text-[#ffe69e]">
        <Link href="/chat" className="underline">{notice} Abrir negociações</Link>
        <button type="button" aria-label="Dispensar aviso de mensagem" onClick={()=>setNotice("")}>Fechar</button>
      </div>}
    </header>
  );
}
