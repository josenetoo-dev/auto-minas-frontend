import Link from "next/link";

export default function Logo({ size = "md", compactOnMobile = false }: { size?: "md" | "lg"; compactOnMobile?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Auto Minas — Página inicial">
      <span
        className={`grid place-items-center rounded-xl bg-gradient-to-br from-[#f2d87e] via-[#d4af37] to-[#8a6d1c] shadow-[0_0_20px_rgba(212,175,55,0.35)] ${
          size === "lg" ? "h-11 w-11" : "h-9 w-9"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#141005"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={size === "lg" ? "h-6 w-6" : "h-5 w-5"}
        >
          <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <path d="M4 11h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5a2 2 0 1 1-4 0h-5a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
          <path d="M7 8.5h.01M17 8.5h.01" />
        </svg>
      </span>
      <span className={`${compactOnMobile ? "hidden min-[430px]:flex" : "flex"} min-w-0 flex-col leading-none`}>
        <span
          className={`font-display font-bold tracking-wide gold-text ${
            size === "lg" ? "text-3xl" : "text-xl"
          }`}
        >
          AUTO MINAS
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#9b9ba4]">
          Marketplace de veículos
        </span>
      </span>
    </Link>
  );
}
