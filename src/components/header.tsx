"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./logo";

export type HeaderUser = {
  name: string;
  avatarUrl: string | null;
};

type Props = {
  user: HeaderUser | null;
  unreadCount: number;
};

const NAV = [
  { href: "/", label: "Início" },
  { href: "/carros", label: "Comprar Carro" },
  { href: "/vender", label: "Vender Carro" },
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

export default function Header({ user, unreadCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        setMenuOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
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
                <div className="absolute right-0 z-50 mt-2 w-[min(15rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#26262e] bg-[#101014] shadow-2xl shadow-black/60 animate-fade-up">
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
    </header>
  );
}
