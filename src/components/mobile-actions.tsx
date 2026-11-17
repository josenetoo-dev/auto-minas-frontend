"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ type }: { type: "home" | "search" | "plus" | "chat" | "user" }) {
  if (type === "home") return <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />;
  if (type === "search") return <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>;
  if (type === "plus") return <><path d="M12 5v14M5 12h14" /></>;
  if (type === "chat") return <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" />;
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

export default function MobileActions() {
  const path = usePathname();

  if (path === "/") {
    const items = [
      { href: "/", label: "Início", icon: "home" as const },
      { href: "/carros", label: "Carros", icon: "search" as const },
      { href: "/vender", label: "Anunciar", icon: "plus" as const, primary: true },
      { href: "/chat", label: "Negociações", icon: "chat" as const },
      { href: "/conta", label: "Perfil", icon: "user" as const },
    ];

    return (
      <nav aria-label="Navegação da página inicial" className="home-bottom-nav">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === "/" ? "page" : undefined}
            className={`home-bottom-nav-item ${item.primary ? "is-primary" : ""} ${item.href === "/" ? "is-active" : ""}`}
          >
            <span className="home-bottom-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><HomeIcon type={item.icon} /></svg>
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  if (!["/carros", "/planos"].includes(path)) return null;

  return (
    <nav aria-label="Ações rápidas" className="mobile-actions">
      <Link href="/carros" className="flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-[#f1e4c8]">
        Buscar veículos
      </Link>
      <Link href="/planos" className="btn-gold min-h-12">Anunciar veículo</Link>
    </nav>
  );
}
