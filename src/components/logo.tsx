import Link from "next/link";
import Image from "next/image";

export default function Logo({ size = "md", compactOnMobile = false }: { size?: "md" | "lg"; compactOnMobile?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="Auto Minas — Página inicial">
      <Image
        src="/images/auto-minas-logo.svg"
        alt="Auto Minas — Marketplace de veículos"
        width={720}
        height={170}
        priority={size === "lg"}
        className={`${size === "lg" ? "w-[230px] sm:w-[270px]" : "w-[190px]"} ${compactOnMobile ? "max-[389px]:w-[170px]" : ""} h-auto`}
      />
    </Link>
  );
}
