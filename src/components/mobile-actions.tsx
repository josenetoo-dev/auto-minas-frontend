"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HistoryBackButton from "@/components/history-back-button";

function NavIcon({ type }: { type: "home" | "car" | "plus" | "chat" | "user" }) {
  if (type === "home") return <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />;
  if (type === "car") return <><path d="M5 13l1.6-4.2A2 2 0 0 1 8.5 7.5h7a2 2 0 0 1 1.9 1.3L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></>;
  if (type === "plus") return <><path d="M12 5v14M5 12h14" /></>;
  if (type === "chat") return <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.3A8 8 0 1 1 21 12Z" />;
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

function belongsToApp(path: string) {
  return (
    path === "/" ||
    path === "/carros" ||
    path.startsWith("/carros/") ||
    path === "/vender" ||
    path.startsWith("/vender/") ||
    path === "/meus-anuncios" ||
    path.startsWith("/meus-anuncios/") ||
    path === "/chat" ||
    path.startsWith("/chat/") ||
    path === "/conta" ||
    path.startsWith("/conta/") ||
    path === "/perfil" ||
    path.startsWith("/perfil/") ||
    path === "/planos" ||
    path === "/assinatura" ||
    path === "/verificacoes" ||
    path === "/moderacao" ||
    path.startsWith("/moderacao/") ||
    path === "/termos" ||
    path === "/privacidade" ||
    path.startsWith("/privacidade/") ||
    path === "/cookies" ||
    path === "/legal" ||
    path === "/reembolsos" ||
    path === "/feira"
  );
}

function backFallback(path: string) {
  if (path.startsWith("/carros/")) return "/carros";
  if (path.startsWith("/meus-anuncios/")) return "/meus-anuncios";
  if (path.startsWith("/vender/editar/")) return "/meus-anuncios";
  if (path.startsWith("/vender/planos")) return "/planos";
  if (path.startsWith("/chat/")) return "/chat";
  if (path.startsWith("/conta/")) return "/conta";
  if (path.startsWith("/perfil/")) return "/carros";
  if (path === "/assinatura" || path === "/verificacoes") return "/conta";
  if (path === "/moderacao" || path.startsWith("/moderacao/")) return "/conta";
  if (path === "/privacidade/solicitacoes") return "/privacidade";
  if (path === "/termos" || path === "/privacidade" || path === "/cookies" || path === "/legal" || path === "/reembolsos" || path === "/feira") return "/";
  if (path === "/planos") return "/";
  return "/";
}

export default function MobileActions() {
  const path = usePathname();

  if (!belongsToApp(path)) return null;

  const items = [
    { href: "/", label: "Início", icon: "home" as const },
    { href: "/carros", label: "Carros", icon: "car" as const },
    { href: "/vender", label: "Anunciar", icon: "plus" as const, primary: true },
    { href: "/chat", label: "Chat", icon: "chat" as const },
    { href: "/conta", label: "Perfil", icon: "user" as const },
  ];

  const rootTabs = new Set(["/", "/carros", "/vender", "/chat", "/conta"]);
  const showDesktopBack = !rootTabs.has(path);

  return (
    <>
      {showDesktopBack && (
        <HistoryBackButton fallback={backFallback(path)} className="site-desktop-back" ariaLabel="Voltar para a página anterior">
          <span aria-hidden="true">←</span>
          <strong>Voltar</strong>
        </HistoryBackButton>
      )}

      {!path.startsWith("/chat/") && <nav aria-label="Navegação principal" className="home-bottom-nav site-global-hotbar">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? path === "/"
              : item.href === "/vender"
                ? path === "/vender" || path.startsWith("/vender/")
                : item.href === "/conta"
                  ? path === "/conta" || path.startsWith("/conta/") || path.startsWith("/perfil/") || path === "/assinatura" || path === "/verificacoes" || path === "/moderacao" || path.startsWith("/moderacao/") || path === "/privacidade/solicitacoes"
                  : item.href === "/chat"
                    ? path === "/chat" || path.startsWith("/chat/")
                    : item.href === "/carros"
                      ? path === "/carros" || path.startsWith("/carros/")
                      : path === item.href;

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
      </nav>}
    </>
  );
}
