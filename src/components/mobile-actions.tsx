"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavIcon({ type }: { type: "home" | "car" | "plus" | "chat" | "user" }) {
  if (type === "home") return <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />;
  if (type === "car") return <><path d="M5 13l1.6-4.2A2 2 0 0 1 8.5 7.5h7a2 2 0 0 1 1.9 1.3L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></>;
  if (type === "plus") return <><path d="M12 5v14M5 12h14" /></>;
  if (type === "chat") return <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" />;
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

export default function MobileActions() {
  const path = usePathname();

  if (path === "/" || path === "/carros" || path === "/vender" || path === "/conta" || path === "/conta/editar" || /^\/meus-anuncios\/\d+$/.test(path) || /^\/vender\/editar\/\d+$/.test(path)) {
    const items = [
      { href: "/", label: "Início", icon: "home" as const },
      { href: "/carros", label: "Carros", icon: "car" as const },
      { href: "/vender", label: "Anunciar", icon: "plus" as const, primary: true },
      { href: "/chat", label: "Chat", icon: "chat" as const },
      { href: "/conta", label: "Perfil", icon: "user" as const },
    ];

    return (
      <nav aria-label="Navegação principal" className="home-bottom-nav">
        {items.map((item) => {
          const active = item.href === "/" ? path === "/" : item.href === "/vender" ? path === "/vender" || path.startsWith("/vender/") : item.href === "/conta" ? path === "/conta" || path.startsWith("/conta/") : path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`home-bottom-nav-item ${item.primary ? "is-primary" : ""} ${active ? "is-active" : ""}`}
            >
              <span className="home-bottom-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><NavIcon type={item.icon} /></svg>
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  if (path !== "/planos") return null;

  return (
    <nav aria-label="Ações rápidas" className="mobile-actions">
      <Link href="/carros" className="flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-[#f1e4c8]">
        Buscar veículos
      </Link>
      <Link href="/planos" className="btn-gold min-h-12">Anunciar veículo</Link>
    </nav>
  );
}
