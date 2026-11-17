import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
import Logo from "@/components/logo";
import { safeNextPath } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre ou crie sua conta no Auto Minas para cadastrar anúncios e enviar propostas.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <div className="flex min-h-[75dvh] flex-col items-center justify-center gap-6 bg-[#171714] px-4 py-10 sm:py-16">
      <Logo />
      <AuthForm next={safeNext} error={error} />
    </div>
  );
}
