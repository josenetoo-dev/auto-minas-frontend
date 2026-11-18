import type { ReactNode } from "react";
import Link from "next/link";
import HistoryBackButton from "@/components/history-back-button";

export default function AdminShell({
  role,
  title,
  description,
  active,
  children,
}: {
  role: "ADMIN" | "REVIEWER";
  title: string;
  description: string;
  active: "moderation" | "commercial" | "privacy";
  children: ReactNode;
}) {
  const links = [
    { href: "/moderacao", label: "Moderação", key: "moderation" as const },
    ...(role === "ADMIN"
      ? [
          { href: "/moderacao/comercial", label: "Comercial", key: "commercial" as const },
          { href: "/moderacao/privacidade", label: "Privacidade", key: "privacy" as const },
        ]
      : []),
  ];

  return (
    <div className="admin-shell-screen">
      <header className="admin-shell-topbar">
        <HistoryBackButton fallback="/conta" className="admin-shell-back" ariaLabel="Voltar">
          ←
        </HistoryBackButton>
        <Link href="/" className="admin-shell-brand">
          <span>AM</span>
          <strong>Auto Minas</strong>
        </Link>
        <span className="admin-shell-role">{role === "ADMIN" ? "Administrador" : "Revisor"}</span>
      </header>

      <main className="admin-shell-content">
        <section className="admin-shell-hero">
          <div>
            <p>Área restrita</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </div>
          <div className="admin-shell-symbol" aria-hidden="true">⌘</div>
        </section>

        <nav className="admin-shell-nav" aria-label="Administração">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={active === item.key ? "is-active" : ""}>
              {item.label}
            </Link>
          ))}
          <Link href="/conta">Minha conta</Link>
        </nav>

        <section className="admin-shell-panel">
          {children}
        </section>
      </main>
    </div>
  );
}
