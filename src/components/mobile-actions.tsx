"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/carros", label: "Comprar", icon: "search" },
  { href: "/vender", label: "Anunciar", icon: "plus", primary: true },
  { href: "/chat", label: "Negociações", icon: "chat" },
  { href: "/conta", label: "Conta", icon: "user" },
] as const;

function Icon({ name }: { name: (typeof ITEMS)[number]["icon"] }) {
  if (name === "home") return <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />;
  if (name === "search") return <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>;
  if (name === "plus") return <><path d="M12 5v14M5 12h14" /></>;
  if (name === "chat") return <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" />;
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

export default function MobileActions() {
  const path = usePathname();
  if (
    path.startsWith("/login") ||
    path.startsWith("/recuperar-senha") ||
    path.startsWith("/moderacao") ||
    path.startsWith("/legal") ||
    path.startsWith("/privacidade") ||
    path.startsWith("/termos") ||
    path.startsWith("/cookies") ||
    path.startsWith("/reembolsos") ||
    path.startsWith("/feira")
  ) return null;

  return (
    <nav aria-label="Navegação principal mobile" className="am-bottom-nav">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? path === "/" : path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`am-bottom-nav-item ${active ? "is-active" : ""} ${item.primary ? "is-primary" : ""}`}
          >
            <span className="am-bottom-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <Icon name={item.icon} />
              </svg>
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
